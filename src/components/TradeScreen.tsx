"use client";

import { useEffect, useRef, useState } from "react";
import { changePct, fmtFunding, fmtPct, fmtPrice, fmtUsd, fundingApr } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { INTERVALS, type Interval, type Market } from "@/lib/types";
import { CandleChart } from "./chart/CandleChart";
import { OrderBook } from "./chart/OrderBook";
import { TradesList } from "./chart/TradesList";
import { MarketTable } from "./markets/MarketTable";
import { useMarkets } from "./markets/store";
import { Nav } from "./Nav";
import { OrderForm } from "./trade/OrderForm";
import { PositionsPanel } from "./trade/PositionsPanel";
import { CoinIcon } from "./ui/CoinIcon";
import { Num } from "./ui/Num";
import { WalletBar } from "./wallet/WalletBar";

function Stat({ label, value, tone = "" }: { label: string; value: string | null; tone?: string }) {
  return (
    <div className="shrink-0">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 text-xs font-semibold">
        <Num value={value} className={tone} />
      </div>
    </div>
  );
}

/** Time left until the next hourly funding payment. */
function useFundingCountdown() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const left = 3600 - (Math.floor(Date.now() / 1000) % 3600);
      setText(`${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return text;
}

/** The trading screen: market bar, chart, order book and trades, order ticket, positions. */
export function TradeScreen({ initial }: { initial: Market }) {
  const markets = useMarkets();
  const m = markets?.find((x) => x.coin === initial.coin) ?? initial;
  const live = m.mark > 0;
  const chg = changePct(m.mark, m.prev);
  const tone = chg >= 0 ? "text-long" : "text-short";
  const countdown = useFundingCountdown();

  const [interval, setChartInterval] = useState<Interval>("15m");
  const [side, setSide] = useState<"book" | "trades">("book");
  const [picked, setPicked] = useState<{ px: number } | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const selector = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selecting) return;
    const onDown = (e: MouseEvent) => {
      if (!selector.current?.contains(e.target as Node)) setSelecting(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelecting(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [selecting]);

  const slug = encodeURIComponent(m.coin);
  const link = `${SITE_URL}/t/${slug}`;
  const copy = () =>
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });

  const panelTab = (on: boolean) =>
    `h-9 flex-1 border-b-2 text-xs font-semibold transition ${on ? "border-accent text-white" : "border-transparent text-muted hover:text-white"}`;
  const share = "h-8 shrink-0 rounded-lg border border-line px-3 text-xs font-semibold leading-8 text-white/85 transition hover:border-accent hover:text-white";

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Nav active="trade" loginHref={`/t/${slug}?login=1`} />

      {/* Market bar */}
      <div className="relative z-30 flex h-16 shrink-0 items-center gap-5 border-b border-line bg-panel px-3 sm:px-4">
        <div ref={selector} className="relative shrink-0">
          <button
            onClick={() => setSelecting((v) => !v)}
            aria-expanded={selecting}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-raised"
          >
            <CoinIcon coin={m.coin} size={30} />
            <span className="text-lg font-extrabold leading-none">{m.coin}-USD</span>
            <span className="num rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">{m.maxLev}x</span>
            <span className={`text-xs text-muted transition-transform ${selecting ? "rotate-180" : ""}`}>▼</span>
          </button>
          {selecting && (
            <div className="absolute left-0 top-full mt-2 flex h-[460px] w-[400px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-line bg-panel pt-3 shadow-[0_24px_70px_rgba(0,0,0,0.7)]">
              <MarketTable markets={markets} hrefBase="/t" compact onNavigate={() => setSelecting(false)} />
            </div>
          )}
        </div>

        <div className="shrink-0">
          <div className={`text-xl font-bold leading-none ${tone}`}>
            <Num value={live ? fmtPrice(m.mark) : null} skeleton="w-24" />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">Mark price</div>
        </div>

        <div className="scroll-x flex min-w-0 flex-1 items-center gap-6 overflow-x-auto [scrollbar-width:none]">
          <Stat label="24h change" value={live ? fmtPct(chg) : null} tone={tone} />
          <Stat label="24h volume" value={live ? fmtUsd(m.vol) : null} />
          <Stat label="Open interest" value={live ? fmtUsd(m.oi) : null} />
          <Stat
            label="Funding / countdown"
            value={live && countdown ? `${fmtFunding(m.funding)}  ${countdown}` : null}
            tone={m.funding >= 0 ? "text-long" : "text-short"}
          />
          <Stat label="Funding APR" value={live ? fmtPct(fundingApr(m.funding), 1) : null} />
        </div>

        <div className="hidden shrink-0 gap-2 xl:flex">
          <button onClick={copy} className={share}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={`https://x.com/intent/post?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Long or short $${m.coin} right here in the post`)}`}
            target="_blank"
            rel="noopener"
            className={share}
          >
            Post on X
          </a>
        </div>
      </div>

      {/* Chart | book and trades | order ticket. The 1px gaps show the line colour as dividers. */}
      <div className="grid gap-px bg-line lg:grid-cols-[minmax(0,1fr)_280px_320px]">
        <section className="flex min-w-0 flex-col bg-panel">
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line px-2">
            {INTERVALS.map((i) => (
              <button
                key={i}
                onClick={() => setChartInterval(i)}
                className={`num h-6 rounded px-2 text-[11px] font-semibold transition ${
                  interval === i ? "bg-accent text-white" : "text-muted hover:text-white"
                }`}
              >
                {i}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1.5 pr-1 text-[10px] uppercase tracking-wider text-muted">
              <span className="live-dot" />
              Live
            </span>
          </div>
          <div className="h-[380px] p-1 lg:h-auto lg:min-h-[540px] lg:flex-1">
            <CandleChart coin={m.coin} interval={interval} />
          </div>
        </section>

        <section className="order-3 bg-panel lg:order-2">
          <div className="flex border-b border-line px-3">
            <button className={panelTab(side === "book")} onClick={() => setSide("book")}>
              Order book
            </button>
            <button className={panelTab(side === "trades")} onClick={() => setSide("trades")}>
              Trades
            </button>
          </div>
          {side === "book" ? <OrderBook coin={m.coin} mark={m.mark} onPick={(px) => setPicked({ px })} /> : <TradesList coin={m.coin} />}
        </section>

        <section className="order-2 bg-panel lg:order-3">
          <div className="border-b border-line px-3 md:hidden">
            <WalletBar loginHref={`/t/${slug}?login=1`} />
          </div>
          <OrderForm market={m} pickedPx={picked} />
        </section>
      </div>

      <div className="mt-px flex-1 border-t border-line bg-panel">
        <PositionsPanel markets={markets} />
      </div>
    </div>
  );
}
