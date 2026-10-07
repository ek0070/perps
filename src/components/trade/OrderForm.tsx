"use client";

import { useEffect, useState } from "react";
import { fmtPrice, fmtUsd } from "@/lib/format";
import type { Market } from "@/lib/types";
import { Num } from "../ui/Num";
import { DepositModal } from "../wallet/DepositModal";
import { useWallet } from "../wallet/WalletContext";
import { setSettings, SLIPPAGE_OPTIONS, useSettings } from "./settings";
import { TradeStatusLine } from "./TradeStatusLine";
import { MIN_NOTIONAL, useTrade, useTradeStatus } from "./useTrade";

const TAKER_FEE = 0.00045;
const MAKER_FEE = 0.00015;

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-5 items-center justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="num text-white/90">{value}</span>
    </div>
  );
}

/** The order ticket of the full trading screen: market or limit, long or short, size, leverage. */
export function OrderForm({ market, pickedPx }: { market: Market; pickedPx: { px: number } | null }) {
  const settings = useSettings();
  const { configured, ready, address, account, login } = useWallet();
  const { open } = useTrade();
  const busy = useTradeStatus().state === "pending";

  const [type, setType] = useState<"market" | "limit">("market");
  const [isLong, setIsLong] = useState(true);
  const [size, setSize] = useState("");
  const [limit, setLimit] = useState("");
  const [levChoice, setLevChoice] = useState<number | null>(null);
  const [deposit, setDeposit] = useState(false);

  // A click on an order book level fills the limit price.
  useEffect(() => {
    if (!pickedPx) return;
    setType("limit");
    setLimit(String(pickedPx.px));
  }, [pickedPx]);

  const lev = Math.max(1, Math.min(levChoice ?? settings.leverage, market.maxLev));
  const notional = Number(size) || 0;
  const margin = notional / lev;
  const available = account?.withdrawable ?? 0;
  const entry = type === "limit" ? Number(limit) || 0 : market.mark;
  // Estimate only: isolated-style liquidation with the market's maintenance margin.
  const mmr = 1 / (2 * market.maxLev);
  const liq = entry > 0 && notional > 0 ? entry * (isLong ? 1 - 1 / lev + mmr : 1 + 1 / lev - mmr) : 0;
  const tooSmall = notional > 0 && notional < MIN_NOTIONAL;
  const disabled = busy || !(notional >= MIN_NOTIONAL) || (type === "limit" && !(entry > 0));

  const clean = (v: string) => v.replace(/[^0-9.]/g, "").slice(0, 12);
  const field = "num h-10 w-full rounded-lg border border-line bg-bg px-3 text-right text-sm outline-none transition placeholder:text-muted/60 focus:border-accent";
  const tab = (on: boolean) =>
    `h-9 flex-1 border-b-2 text-xs font-semibold transition ${on ? "border-accent text-white" : "border-transparent text-muted hover:text-white"}`;

  const submit = () => {
    if (!address) return login();
    open(market, isLong, margin, lev, type === "limit" ? entry : undefined);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="-mx-3 -mt-3 flex border-b border-line px-3">
        <button className={tab(type === "market")} onClick={() => setType("market")}>
          Market
        </button>
        <button className={tab(type === "limit")} onClick={() => setType("limit")}>
          Limit
        </button>
      </div>

      <div className="flex rounded-lg bg-bg p-1">
        <button
          onClick={() => setIsLong(true)}
          className={`h-9 flex-1 rounded-md text-sm font-bold transition ${isLong ? "bg-long text-black shadow-[0_0_18px_rgba(22,217,164,0.45)]" : "text-muted hover:text-white"}`}
        >
          Long
        </button>
        <button
          onClick={() => setIsLong(false)}
          className={`h-9 flex-1 rounded-md text-sm font-bold transition ${!isLong ? "bg-short text-white shadow-[0_0_18px_rgba(255,77,116,0.45)]" : "text-muted hover:text-white"}`}
        >
          Short
        </button>
      </div>

      <div className="flex h-5 items-center justify-between text-xs">
        <span className="text-muted">Available</span>
        <span className="flex items-center gap-2">
          <Num value={address ? (account ? fmtUsd(available) : null) : "$0.00"} className="text-white/90" />
          {address && (
            <button onClick={() => setDeposit(true)} className="font-semibold text-accent transition hover:text-white">
              Deposit
            </button>
          )}
        </span>
      </div>

      {type === "limit" && (
        <label className="block">
          <span className="mb-1 flex justify-between text-[11px] text-muted">
            Limit price (USD)
            <button type="button" onClick={() => setLimit(String(market.mark))} className="font-semibold text-accent hover:text-white">
              Mark
            </button>
          </span>
          <input value={limit} onChange={(e) => setLimit(clean(e.target.value))} inputMode="decimal" placeholder={fmtPrice(market.mark)} className={field} />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-[11px] text-muted">Order size (USD)</span>
        <input value={size} onChange={(e) => setSize(clean(e.target.value))} inputMode="decimal" placeholder="0.00" className={field} />
      </label>
      <div className="flex gap-1.5">
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            disabled={!(available > 0)}
            onClick={() => setSize((Math.floor(available * lev * pct) / 100).toFixed(2))}
            className="num h-7 flex-1 rounded-md border border-line text-[11px] text-muted transition hover:border-accent hover:text-white disabled:opacity-40"
          >
            {pct}%
          </button>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted">
          <span>Leverage</span>
          <span className="num rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold text-white">{lev}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={market.maxLev}
          step={1}
          value={lev}
          onChange={(e) => setLevChoice(Number(e.target.value))}
          aria-label="Leverage"
          className="lev w-full"
        />
        <div className="num mt-1 flex justify-between text-[10px] text-muted">
          <span>1x</span>
          <span>{market.maxLev}x</span>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-bg/60 px-3 py-2">
        <Line label="Order value" value={notional > 0 ? fmtUsd(notional) : "$0.00"} />
        <Line label="Margin required" value={notional > 0 ? fmtUsd(margin) : "$0.00"} />
        <Line label="Est. liquidation" value={liq > 0 && lev > 1 ? `$${fmtPrice(liq)}` : "None"} />
        <Line label={type === "limit" ? "Fee (maker)" : "Fee (taker)"} value={fmtUsd(notional * (type === "limit" ? MAKER_FEE : TAKER_FEE))} />
        {type === "market" && (
          <div className="flex h-5 items-center justify-between text-xs">
            <span className="text-muted">Max slippage</span>
            <span className="flex gap-1">
              {SLIPPAGE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSettings({ slippage: s })}
                  className={`num rounded px-1.5 text-[11px] transition ${settings.slippage === s ? "bg-accent text-white" : "text-muted hover:text-white"}`}
                >
                  {s}%
                </button>
              ))}
            </span>
          </div>
        )}
      </div>

      {!configured ? (
        <div className="rounded-lg border border-line px-3 py-2.5 text-center text-xs text-muted">Wallet login is not configured.</div>
      ) : !ready ? (
        <span className="skel h-11 w-full rounded-lg" />
      ) : !address ? (
        <button onClick={login} className="btn-brand h-11 rounded-lg text-sm font-bold">
          Log in to trade
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={disabled}
          className={`h-11 rounded-lg text-sm font-bold transition disabled:opacity-40 ${
            isLong ? "bg-long text-black hover:brightness-110" : "bg-short text-white hover:brightness-110"
          }`}
        >
          {tooSmall ? `Minimum order $${MIN_NOTIONAL}` : `${isLong ? "Long" : "Short"} ${market.coin}`}
        </button>
      )}

      <TradeStatusLine />
      {deposit && address && <DepositModal address={address} onClose={() => setDeposit(false)} />}
    </div>
  );
}
