"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "../Logo";
import { TradeStatusLine } from "../trade/TradeStatusLine";
import { WalletBar } from "../wallet/WalletBar";
import { MarketList, RANKINGS, type Ranking } from "./MarketList";
import { useMarkets } from "./store";

/** The tabbed feed. Fills its container; `embed` is the 480x480 player inside a post. */
export function PulseFeed({ embed = false }: { embed?: boolean }) {
  const markets = useMarkets();
  const [tab, setTab] = useState<Ranking>("movers");

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <header className="flex h-10 shrink-0 items-center justify-between px-3">
        <Link href={embed ? "/embed/pulse" : "/"} className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-display text-xs font-extrabold uppercase tracking-[0.22em]">Pulse</span>
        </Link>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/50">
          <span className="live-dot" />
          Live perps
        </span>
      </header>

      <div className="shrink-0 px-3">
        <WalletBar loginHref="/t/pulse?login=1" />
      </div>

      <nav className="flex h-9 shrink-0 border-b border-white/10 px-1" role="tablist">
        {RANKINGS.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={tab === r.key}
            onClick={() => setTab(r.key)}
            className={`flex-1 border-b-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] transition ${
              tab === r.key ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/80"
            }`}
          >
            {r.label}
          </button>
        ))}
      </nav>

      <div className="scroll-y min-h-0 flex-1">
        <MarketList markets={markets} by={tab} hrefBase={embed ? "/embed" : "/t"} />
      </div>
      <TradeStatusLine floating />
    </div>
  );
}
