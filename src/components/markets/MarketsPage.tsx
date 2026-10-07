"use client";

import Link from "next/link";
import { fmtUsd } from "@/lib/format";
import { Nav } from "../Nav";
import { TradeStatusLine } from "../trade/TradeStatusLine";
import { Num } from "../ui/Num";
import { WalletBar } from "../wallet/WalletBar";
import { MarketTable } from "./MarketTable";
import { useMarkets } from "./store";

/** Every perp market in one table. `embed` is the 480x480 player inside a post. */
export function MarketsPage({ embed = false }: { embed?: boolean }) {
  const markets = useMarkets();

  if (embed) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-panel">
        <header className="flex h-10 shrink-0 items-center justify-between px-3">
          <Link href="/embed/pulse" className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em]">Markets</span>
          </Link>
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
            <span className="live-dot" />
            Live perps
          </span>
        </header>
        <div className="shrink-0 px-3 pb-1">
          <WalletBar loginHref="/t/pulse?login=1" />
        </div>
        <div className="min-h-0 flex-1">
          <MarketTable markets={markets} hrefBase="/embed" compact quickLong />
        </div>
        <TradeStatusLine floating />
      </div>
    );
  }

  const volume = markets ? markets.reduce((s, m) => s + m.vol, 0) : null;
  const oi = markets ? markets.reduce((s, m) => s + m.oi, 0) : null;

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <Nav active="markets" loginHref="/pulse?login=1" />
      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-0 pt-5 sm:px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-4 sm:px-0">
          <div>
            <h1 className="text-2xl font-extrabold">Markets</h1>
            <p className="mt-1 text-sm text-muted">Every perpetual market, live. Click a row to trade it.</p>
          </div>
          <div className="flex gap-6">
            {[
              ["Markets", markets ? String(markets.length) : null],
              ["24h volume", volume === null ? null : fmtUsd(volume)],
              ["Open interest", oi === null ? null : fmtUsd(oi)],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
                <div className="mt-0.5 text-base font-bold">
                  <Num value={value} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto rounded-t-xl border border-b-0 border-line bg-panel pt-4">
          <div className="h-full min-w-[820px]">
            <MarketTable markets={markets} hrefBase="/t" />
          </div>
        </div>
      </div>
      <TradeStatusLine floating />
    </div>
  );
}
