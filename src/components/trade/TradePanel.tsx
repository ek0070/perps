"use client";

import { useState } from "react";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import type { Market } from "@/lib/types";
import { Num } from "../ui/Num";
import { useWallet } from "../wallet/WalletContext";
import { QUICK_OPTIONS, setSettings, SLIPPAGE_OPTIONS, useSettings } from "./settings";
import { TradeStatusLine } from "./TradeStatusLine";
import { MIN_NOTIONAL, useTrade, useTradeStatus } from "./useTrade";

const MARGINS = [10, 50, 100];

function leverageOptions(maxLev: number): number[] {
  return [...[2, 5, 10, 20].filter((x) => x < maxLev), maxLev];
}

const chip = (on: boolean) =>
  `h-8 flex-1 rounded-lg border text-xs font-semibold transition num ${
    on ? "border-accent bg-accent text-white" : "border-line text-white/80 hover:border-accent hover:text-white"
  }`;

/** The compact ticket used by the 480x480 player: presets instead of free-form inputs. */
export function TradePanel({ market }: { market: Market }) {
  const settings = useSettings();
  const { account } = useWallet();
  const { open, close } = useTrade();
  const busy = useTradeStatus().state === "pending";

  const [margin, setMargin] = useState(MARGINS[0]);
  const [custom, setCustom] = useState("");
  const [levChoice, setLevChoice] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const lev = Math.min(levChoice ?? settings.leverage, market.maxLev);
  const amount = custom ? Number(custom) || 0 : margin;
  const notional = amount * lev;
  const tooSmall = notional < MIN_NOTIONAL;
  const pos = account?.positions.find((p) => p.coin === market.coin);

  const big = "h-12 flex-1 rounded-xl text-base font-extrabold uppercase tracking-[0.14em] transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className="relative flex flex-col gap-2">
      {pos && (
        <div className="rounded-xl border border-line bg-bg/60 px-2.5 py-1.5">
          <div className="flex h-5 items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className={`font-bold uppercase ${pos.size > 0 ? "text-long" : "text-short"}`}>{pos.size > 0 ? "Long" : "Short"}</span>
              <span className="num text-muted">
                {Math.abs(pos.size)} · {pos.leverage}x
              </span>
            </span>
            <span className={`flex items-center gap-1.5 ${pos.pnl >= 0 ? "text-long" : "text-short"}`}>
              <Num value={`${pos.pnl >= 0 ? "+" : "-"}${fmtUsd(Math.abs(pos.pnl))}`} className="font-bold" />
              <Num value={fmtPct(pos.roe, 1)} />
            </span>
          </div>
          <div className="mt-1 flex h-7 items-center gap-1.5 text-[11px]">
            <span className="num mr-auto text-muted">
              Entry {fmtPrice(pos.entryPx)} · Liq {pos.liqPx ? fmtPrice(pos.liqPx) : "none"}
            </span>
            {[25, 50, 100].map((pct) => (
              <button
                key={pct}
                disabled={busy}
                onClick={() => close(market, pos, pct / 100)}
                className="num h-7 rounded-lg border border-line px-2 font-semibold text-white/85 transition hover:border-accent hover:text-white disabled:opacity-35"
              >
                {pct === 100 ? "Close" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="w-12 shrink-0 text-[10px] uppercase tracking-wider text-muted">Margin</span>
        {MARGINS.map((m) => (
          <button
            key={m}
            className={chip(!custom && margin === m)}
            onClick={() => {
              setMargin(m);
              setCustom("");
            }}
          >
            ${m}
          </button>
        ))}
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, "").slice(0, 8))}
          inputMode="decimal"
          placeholder="Custom"
          aria-label="Custom margin in USD"
          className={`num h-8 w-0 flex-[1.3] rounded-lg border bg-bg px-2 text-center text-xs outline-none transition placeholder:text-muted/70 focus:border-accent ${custom ? "border-accent" : "border-line"}`}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="w-12 shrink-0 text-[10px] uppercase tracking-wider text-muted">Lev</span>
        {leverageOptions(market.maxLev).map((x) => (
          <button key={x} className={chip(lev === x)} onClick={() => setLevChoice(x)}>
            {x}x
          </button>
        ))}
      </div>

      <div className="flex h-4 items-center justify-between text-[11px] text-muted">
        <span className="num">
          {tooSmall ? `Minimum position is $${MIN_NOTIONAL}` : `Position ${fmtUsd(notional)} · slippage ${settings.slippage}%`}
        </span>
        <button onClick={() => setShowSettings(true)} className="font-semibold text-accent transition hover:text-white">
          Settings
        </button>
      </div>

      <div className="flex gap-2">
        <button
          disabled={busy || tooSmall}
          onClick={() => open(market, true, amount, lev)}
          className={`${big} bg-long text-black shadow-[0_0_22px_rgba(22,217,164,0.35)]`}
        >
          Long
        </button>
        <button
          disabled={busy || tooSmall}
          onClick={() => open(market, false, amount, lev)}
          className={`${big} bg-short text-white shadow-[0_0_22px_rgba(255,77,116,0.35)]`}
        >
          Short
        </button>
      </div>

      <TradeStatusLine />

      {showSettings && (
        <div className="absolute inset-0 z-10 flex flex-col gap-2 rounded-xl border border-line bg-panel p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-[0.18em]">Settings</span>
            <button onClick={() => setShowSettings(false)} className="font-semibold text-accent transition hover:text-white">
              Done
            </button>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted">Max slippage</div>
          <div className="flex gap-1.5">
            {SLIPPAGE_OPTIONS.map((s) => (
              <button key={s} className={chip(settings.slippage === s)} onClick={() => setSettings({ slippage: s })}>
                {s}%
              </button>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted">Default leverage</div>
          <div className="flex gap-1.5">
            {[2, 5, 10, 20].map((x) => (
              <button
                key={x}
                className={chip(settings.leverage === x)}
                onClick={() => {
                  setSettings({ leverage: x });
                  setLevChoice(null);
                }}
              >
                {x}x
              </button>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted">Quick-long margin</div>
          <div className="flex gap-1.5">
            {QUICK_OPTIONS.map((q) => (
              <button key={q} className={chip(settings.quick === q)} onClick={() => setSettings({ quick: q })}>
                ${q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
