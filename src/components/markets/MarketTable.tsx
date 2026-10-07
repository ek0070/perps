"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { changePct, fmtFunding, fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import type { Market } from "@/lib/types";
import { useSettings } from "../trade/settings";
import { useTrade } from "../trade/useTrade";
import { CoinIcon } from "../ui/CoinIcon";
import { Num } from "../ui/Num";

type SortKey = "coin" | "price" | "change" | "vol" | "oi" | "funding";
type Sort = { key: SortKey; desc: boolean };

function value(m: Market, key: SortKey): number | string {
  switch (key) {
    case "coin":
      return m.coin.replace(/^k(?=[A-Z])/, "").toUpperCase();
    case "price":
      return m.mark;
    case "change":
      return changePct(m.mark, m.prev);
    case "vol":
      return m.vol;
    case "oi":
      return m.oi;
    case "funding":
      return m.funding;
  }
}

function order(markets: Market[], sort: Sort, query: string): string[] {
  const q = query.trim().toLowerCase();
  const list = q ? markets.filter((m) => m.coin.toLowerCase().includes(q)) : [...markets];
  list.sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    const cmp = typeof x === "string" ? x.localeCompare(y as string) : x - (y as number);
    return sort.desc ? -cmp : cmp;
  });
  return list.map((m) => m.coin);
}

const FULL = "grid grid-cols-[minmax(150px,1.4fr)_1fr_0.8fr_1fr_1fr_1fr_86px] items-center gap-2 px-4";
const COMPACT = "grid grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_auto] items-center gap-2 px-3";

/**
 * One row, fixed height. Memoised on the market object, which keeps its
 * identity while its numbers are unchanged, so a tick re-renders only the rows
 * that moved, and inside them only the numbers whose text changed.
 */
const Row = memo(function Row({
  m,
  href,
  compact,
  onQuick,
  onNavigate,
}: {
  m: Market;
  href: string;
  compact: boolean;
  onQuick?: (m: Market) => void;
  onNavigate?: () => void;
}) {
  const chg = changePct(m.mark, m.prev);
  const chgCls = chg >= 0 ? "text-long" : "text-short";
  return (
    <li className={`relative border-b border-line/60 transition-colors hover:bg-raised/70 ${compact ? `h-11 ${COMPACT}` : `h-12 ${FULL}`}`}>
      <Link href={href} onClick={onNavigate} className="absolute inset-0" aria-label={`Trade ${m.coin}`} />
      <span className="flex min-w-0 items-center gap-2.5">
        <CoinIcon coin={m.coin} size={compact ? 24 : 26} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{m.coin}</span>
            <span className="num rounded bg-accent/20 px-1 text-[9px] leading-[14px] text-accent">{m.maxLev}x</span>
          </span>
          {compact && (
            <span className="block text-[10px] leading-tight text-muted">
              Vol <Num value={fmtUsd(m.vol)} />
            </span>
          )}
        </span>
      </span>
      <span className="text-right text-[13px] font-semibold">
        <Num value={fmtPrice(m.mark)} />
      </span>
      <span className="text-right text-xs">
        <Num value={fmtPct(chg)} className={chgCls} />
      </span>
      {!compact && (
        <>
          <span className="text-right text-xs text-white/80">
            <Num value={fmtUsd(m.vol)} />
          </span>
          <span className="text-right text-xs text-white/80">
            <Num value={fmtUsd(m.oi)} />
          </span>
          <span className="text-right text-xs">
            <Num value={fmtFunding(m.funding)} className={m.funding >= 0 ? "text-long" : "text-short"} />
          </span>
        </>
      )}
      {onQuick ? (
        <button
          onClick={() => onQuick(m)}
          title="Quick long"
          className="relative z-10 h-7 justify-self-end rounded-md bg-long/15 px-2.5 text-[11px] font-bold text-long transition hover:bg-long hover:text-black"
        >
          Long
        </button>
      ) : !compact ? (
        <span className="btn-brand pointer-events-none flex h-7 items-center justify-center rounded-md text-[11px] font-bold">Trade</span>
      ) : (
        <span />
      )}
    </li>
  );
});

/**
 * Every market in one sortable, searchable table. The row order is recomputed
 * on a sort or search change and otherwise every 10 seconds, so rows hold
 * still under the cursor while their numbers update live.
 */
export function MarketTable({
  markets,
  hrefBase,
  compact = false,
  quickLong = false,
  onNavigate,
}: {
  markets: Market[] | null;
  /** "/embed" inside the player, "/t" everywhere else. */
  hrefBase: string;
  compact?: boolean;
  quickLong?: boolean;
  onNavigate?: () => void;
}) {
  const { open } = useTrade();
  const settings = useSettings();
  const [sort, setSort] = useState<Sort>({ key: "vol", desc: true });
  const [query, setQuery] = useState("");

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
  const [rows, setRows] = useState<string[] | null>(null);
  useEffect(() => {
    const compute = () => {
      if (latest.current) setRows(order(latest.current, sort, query));
    };
    compute();
    const t = setInterval(compute, 10_000);
    return () => clearInterval(t);
  }, [sort, query, hasData]);

  const byCoin = useMemo(() => new Map((markets ?? []).map((m) => [m.coin, m])), [markets]);

  const head = (key: SortKey, label: string, right = true) => (
    <button
      onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "coin" }))}
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider transition hover:text-white ${right ? "justify-end" : ""} ${sort.key === key ? "text-white" : "text-muted"}`}
    >
      {label}
      <span className={`text-[8px] ${sort.key === key ? "text-accent" : "opacity-0"}`}>{sort.desc ? "▼" : "▲"}</span>
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={compact ? "px-3 pb-2" : "px-4 pb-3"}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets"
          aria-label="Search markets"
          spellCheck={false}
          className="h-9 w-full rounded-lg border border-line bg-bg px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent"
        />
      </div>
      <div className={`h-8 shrink-0 border-y border-line bg-raised/40 ${compact ? COMPACT : FULL}`}>
        {head("coin", "Market", false)}
        {head("price", "Price")}
        {head("change", "24h")}
        {!compact && head("vol", "24h volume")}
        {!compact && head("oi", "Open interest")}
        {!compact && head("funding", "Funding / h")}
        {compact ? <span className="w-[46px]">{head("vol", "Vol")}</span> : <span />}
      </div>

      <div className="scroll-y min-h-0 flex-1">
        {!markets || !rows ? (
          <ul aria-busy="true">
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i} className={`flex items-center gap-3 border-b border-line/60 ${compact ? "h-11 px-3" : "h-12 px-4"}`}>
                <span className="skel h-6 w-6 rounded-full" />
                <span className="skel h-3 w-20" />
                <span className="skel ml-auto h-3 w-16" />
                <span className="skel h-3 w-12" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted">No market matches &ldquo;{query}&rdquo;.</div>
        ) : (
          <ul>
            {rows.map((coin) => {
              const m = byCoin.get(coin);
              return m ? (
                <Row
                  key={coin}
                  m={m}
                  href={`${hrefBase}/${encodeURIComponent(coin)}`}
                  compact={compact}
                  onQuick={quickLong ? onQuick : undefined}
                  onNavigate={onNavigate}
                />
              ) : null;
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
