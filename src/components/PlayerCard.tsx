"use client";

import Link from "next/link";
import { changePct, fmtFunding, fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import type { Market } from "@/lib/types";
import { CandleChart } from "./chart/CandleChart";
import { useMarket } from "./markets/store";
import { TradePanel } from "./trade/TradePanel";
import { CoinIcon } from "./ui/CoinIcon";
import { Num } from "./ui/Num";
import { WalletBar } from "./wallet/WalletBar";

/** The 480x480 player X embeds. Fills the iframe, never scrolls. */
export function PlayerCard({ initial }: { initial: Market }) {
  const m = useMarket(initial);
  const chg = changePct(m.mark, m.prev);
  const tone = chg >= 0 ? "text-long" : "text-short";

  return (
    <main className="fixed inset-0 flex flex-col gap-2 overflow-hidden bg-panel p-3">
      <header className="flex h-11 shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <CoinIcon coin={m.coin} size={38} />
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold leading-tight">{m.coin}-USD</div>
            <div className="num text-[10px] leading-tight text-accent">PERP · up to {m.maxLev}x</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold leading-tight ${tone}`}>
            <Num value={fmtPrice(m.mark)} />
          </div>
          <div className="text-xs leading-tight">
            <Num value={fmtPct(chg)} className={tone} />
            <span className="ml-1 text-[10px] text-muted">24h</span>
          </div>
        </div>
      </header>

      <div className="flex h-4 shrink-0 items-center justify-between text-[10px] text-muted">
        <span className="flex gap-3">
          <span>
            Funding <Num value={fmtFunding(m.funding)} className={m.funding >= 0 ? "text-long" : "text-short"} />
          </span>
          <span>
            OI <Num value={fmtUsd(m.oi)} className="text-white/85" />
          </span>
          <span>
            Vol <Num value={fmtUsd(m.vol)} className="text-white/85" />
          </span>
        </span>
        <Link href="/embed/pulse" className="font-semibold uppercase tracking-wider text-accent transition hover:text-white">
          All markets
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-line bg-bg">
        <CandleChart coin={m.coin} interval="5m" compact />
      </div>

      <div className="shrink-0">
        <WalletBar loginHref={`/t/${encodeURIComponent(m.coin)}?login=1`} />
      </div>
      <div className="shrink-0">
        <TradePanel market={m} />
      </div>
    </main>
  );
}
