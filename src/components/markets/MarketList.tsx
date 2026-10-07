"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { changePct, fmtFunding, fmtPct, fmtPrice, fmtUsd, fundingApr } from "@/lib/format";
import type { Market } from "@/lib/types";
import { useSettings } from "../trade/settings";
import { useTrade } from "../trade/useTrade";
import { CoinIcon } from "../ui/CoinIcon";
import { Num } from "../ui/Num";

export type Ranking = "movers" | "volume" | "funding";

export const RANKINGS: { key: Ranking; label: string; hint: string }[] = [
  { key: "movers", label: "Movers", hint: "Biggest 24h moves" },
  { key: "volume", label: "Volume", hint: "Most traded, 24h" },
  { key: "funding", label: "Funding", hint: "Most extreme funding" },
];

const LIQUID = 1_000_000; // ignore dead markets in the movers and funding rankings

function rank(markets: Market[], by: Ranking): Market[] {
  if (by === "volume") return [...markets].sort((a, b) => b.vol - a.vol);
  const liquid = markets.filter((m) => m.vol >= LIQUID);
  if (by === "funding") return liquid.sort((a, b) => Math.abs(b.funding) - Math.abs(a.funding));
  return liquid.sort((a, b) => Math.abs(changePct(b.mark, b.prev)) - Math.abs(changePct(a.mark, a.prev)));
}

const ROW_H = 44;

/**
 * Fixed-height row. Memoised on the market object, which keeps its identity
 * while its numbers are unchanged, so a tick re-renders only the rows that moved
 * and inside them only the Num spans whose text changed.
 */
const MarketRow = memo(function MarketRow({
  m,
  by,
  href,
  onQuick,
}: {
  m: Market;
  by: Ranking;
  href: string;
  onQuick: (m: Market) => void;
}) {
  const chg = changePct(m.mark, m.prev);
  return (
    <li className="group relative flex items-center gap-2.5 border-b border-white/[0.06] px-3 transition-colors hover:bg-white/[0.05]" style={{ height: ROW_H }}>
      <Link href={href} className="absolute inset-0" aria-label={`Open ${m.coin}`} />
      <CoinIcon coin={m.coin} size={26} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-sm font-bold">{m.coin}</span>
          <span className="num rounded border border-white/15 px-1 text-[9px] leading-[14px] text-white/50">{m.maxLev}x</span>
        </div>
        <div className="text-[10px] leading-tight text-white/40">
          {by === "funding" ? (
            <>
              <Num value={fmtFunding(m.funding)} className="text-white/70" />
              <span className="num"> /h · {fmtPct(fundingApr(m.funding), 0)} APR</span>
            </>
          ) : (
            <>
              <span>Vol </span>
              <Num value={fmtUsd(m.vol)} className="text-white/60" />
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-bold leading-tight">
          <Num value={fmtPrice(m.mark)} />
        </div>
        <div className="text-[10px] leading-tight">
          <Num value={fmtPct(chg)} className={chg >= 0 ? "text-white" : "text-white/45"} />
        </div>
      </div>
      <button
        onClick={() => onQuick(m)}
        title="Quick long"
        className="relative z-10 h-7 shrink-0 rounded-lg border border-white/25 px-2 font-display text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:border-white hover:bg-white hover:text-black"
      >
        Long
      </button>
    </li>
  );
});

/**
 * A ranked, live list. The order is recomputed every 10 seconds rather than on
 * every tick, so rows hold still under the cursor while their numbers update.
 */
export function MarketList({
  markets,
  by,
  hrefBase,
  limit = 30,
}: {
  markets: Market[] | null;
  by: Ranking;
  /** "/embed" inside the player, "/t" on full pages. */
  hrefBase: string;
  limit?: number;
}) {
  const { open } = useTrade();
  const settings = useSettings();

  const quick = useRef<(m: Market) => void>(() => {});
  useEffect(() => {
    quick.current = (m) => open(m, true, settings.quick, settings.leverage);
  });
  const onQuick = useCallback((m: Market) => quick.current(m), []);

  const latest = useRef(markets);
  useEffect(() => {
    latest.current = markets;
  });
  const hasData = markets !== null;
  const [order, setOrder] = useState<string[] | null>(null);
  useEffect(() => {
    const compute = () => {
      if (latest.current) setOrder(rank(latest.current, by).slice(0, limit).map((m) => m.coin));
    };
    compute();
    const t = setInterval(compute, 10_000);
    return () => clearInterval(t);
  }, [by, limit, hasData]);

  const byCoin = useMemo(() => new Map((markets ?? []).map((m) => [m.coin, m])), [markets]);

  if (!markets || !order) {
    return (
      <ul aria-busy="true">
        {Array.from({ length: 10 }, (_, i) => (
          <li key={i} className="flex items-center gap-2.5 border-b border-white/[0.06] px-3" style={{ height: ROW_H }}>
            <span className="skel h-[26px] w-[26px] rounded-full" />
            <span className="flex-1">
              <span className="skel block h-3 w-16" />
              <span className="skel mt-1.5 block h-2 w-24" />
            </span>
            <span className="skel h-4 w-16" />
            <span className="skel h-7 w-11 rounded-lg" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul>
      {order.map((coin) => {
        const m = byCoin.get(coin);
        return m ? <MarketRow key={coin} m={m} by={by} href={`${hrefBase}/${encodeURIComponent(coin)}`} onQuick={onQuick} /> : null;
      })}
    </ul>
  );
}
