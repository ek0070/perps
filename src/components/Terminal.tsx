"use client";

import Link from "next/link";
import { useState } from "react";
import { changePct, fmtFunding, fmtPct, fmtPrice, fmtUsd, fundingApr } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { INTERVALS, type Interval, type Market } from "@/lib/types";
import { CandleChart } from "./chart/CandleChart";
import { TradesList } from "./chart/TradesList";
import { Logo, Wordmark } from "./Logo";
import { useMarket } from "./markets/store";
import { TradePanel } from "./trade/TradePanel";
import { CoinIcon } from "./ui/CoinIcon";
import { Num } from "./ui/Num";
import { WalletBar } from "./wallet/WalletBar";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-0.5 text-sm font-bold">
        <Num value={value} />
      </div>
      <div className="num h-3.5 text-[10px] text-white/40">{sub}</div>
    </div>
  );
}

/** The full terminal shown to normal visitors of /t/<coin>. */
export function Terminal({ initial }: { initial: Market }) {
  const m = useMarket(initial);
  const chg = changePct(m.mark, m.prev);
  const [interval, setChartInterval] = useState<Interval>("15m");
  const [copied, setCopied] = useState(false);

  const link = `${SITE_URL}/t/${encodeURIComponent(m.coin)}`;
  const copy = () =>
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });

  const ghost = "h-9 flex-1 rounded-xl border border-white/25 px-3 text-center text-xs font-semibold leading-9 transition hover:border-white hover:bg-white hover:text-black";

  return (
    <div className="min-h-dvh bg-black">
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-4 sm:px-5">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} />
          <Wordmark />
        </Link>
        <Link href="/" className="text-sm font-semibold text-white/60 transition hover:text-white">
          All markets
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <CoinIcon coin={m.coin} size={48} />
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-extrabold leading-tight">{m.coin}</h1>
                <div className="num text-xs text-white/45">PERP · up to {m.maxLev}x</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold leading-tight sm:text-4xl">
                <Num value={`$${fmtPrice(m.mark)}`} />
              </div>
              <div className="text-sm">
                <Num value={fmtPct(chg)} className={chg >= 0 ? "text-white" : "text-white/45"} />
                <span className="ml-1.5 text-xs text-white/35">24h</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="24h volume" value={fmtUsd(m.vol)} />
            <Stat label="Open interest" value={fmtUsd(m.oi)} />
            <Stat label="Funding / hour" value={fmtFunding(m.funding)} sub={`${fmtPct(fundingApr(m.funding), 1)} APR`} />
            <Stat label="24h ago" value={`$${fmtPrice(m.prev)}`} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 p-3">
            <div className="flex h-7 items-center gap-1">
              {INTERVALS.map((i) => (
                <button
                  key={i}
                  onClick={() => setChartInterval(i)}
                  className={`num h-7 rounded-lg px-2.5 text-xs font-semibold transition ${
                    interval === i ? "bg-white text-black" : "text-white/50 hover:text-white"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="mt-2 h-[340px] sm:h-[440px]">
              <CandleChart coin={m.coin} interval={interval} />
            </div>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-white/10 p-3">
            <WalletBar loginHref={`/t/${encodeURIComponent(m.coin)}?login=1`} />
            <div className="mt-2">
              <TradePanel market={m} />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={copy} className={ghost}>
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={`https://x.com/intent/post?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Long or short $${m.coin} right here in the post`)}`}
              target="_blank"
              rel="noopener"
              className={ghost}
            >
              Post on X
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 p-3">
            <h2 className="mb-1 font-display text-xs font-extrabold uppercase tracking-[0.2em]">Live trades</h2>
            <TradesList coin={m.coin} />
          </div>
        </aside>
      </main>
    </div>
  );
}
