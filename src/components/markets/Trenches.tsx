"use client";

import Link from "next/link";
import { Logo, Wordmark } from "../Logo";
import { TradeStatusLine } from "../trade/TradeStatusLine";
import { WalletBar } from "../wallet/WalletBar";
import { MarketList, RANKINGS } from "./MarketList";
import { PulseFeed } from "./PulseFeed";
import { useMarkets } from "./store";

/** The homepage terminal: three live columns on desktop, the tabbed feed on phones. */
export function Trenches() {
  const markets = useMarkets();

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="h-full lg:hidden">
        <PulseFeed />
      </div>

      <div className="hidden h-full min-h-0 flex-col lg:flex">
        <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-white/10 px-5">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={28} />
            <Wordmark />
          </Link>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/50">
              <span className="live-dot" />
              Live perps
            </span>
            <Link href="/about" className="text-sm font-semibold text-white/60 transition hover:text-white">
              About
            </Link>
            <Link
              href="/about#make"
              className="rounded-xl border border-white/25 px-3 py-1.5 text-sm font-semibold transition hover:border-white hover:bg-white hover:text-black"
            >
              Make a link
            </Link>
            <div className="w-[330px]">
              <WalletBar loginHref="/?login=1" />
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-3 divide-x divide-white/10">
          {RANKINGS.map((r) => (
            <section key={r.key} className="flex min-h-0 flex-col">
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
                <h2 className="font-display text-xs font-extrabold uppercase tracking-[0.2em]">{r.label}</h2>
                <span className="text-[10px] uppercase tracking-wider text-white/35">{r.hint}</span>
              </div>
              <div className="scroll-y min-h-0 flex-1">
                <MarketList markets={markets} by={r.key} hrefBase="/t" limit={40} />
              </div>
            </section>
          ))}
        </div>
        <TradeStatusLine floating />
      </div>
    </div>
  );
}
