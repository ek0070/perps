"use client";

import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import { useCallback, useSyncExternalStore } from "react";
import { fmtPrice } from "@/lib/format";
import type { Market } from "@/lib/types";
import { useWallet, type Position } from "../wallet/WalletContext";
import { useSettings } from "./settings";

export type TradeStatus =
  | { state: "idle" }
  | { state: "pending" | "ok" | "error"; msg: string; address?: string };

// One status for the whole page, so a quick-long from a list row and the trade
// panel report in the same place.
let status: TradeStatus = { state: "idle" };
const listeners = new Set<() => void>();
function setStatus(next: TradeStatus) {
  status = next;
  listeners.forEach((fn) => fn());
}

export function useTradeStatus(): TradeStatus {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => status,
    () => status,
  );
}

export const clearTradeStatus = () => setStatus({ state: "idle" });

/** Hyperliquid rejects orders under $10 of notional. */
export const MIN_NOTIONAL = 10;

function explain(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/does not exist|insufficient margin|not enough margin/i.test(raw)) return "Not enough margin. Deposit USDC first.";
  if (/could not immediately match|no liquidity/i.test(raw)) return "Not filled, the price moved. Try again or raise slippage.";
  if (/minimum value|min.*\$?10/i.test(raw)) return "Order is under the $10 minimum.";
  if (/reject|denied|cancel/i.test(raw) && /user/i.test(raw)) return "Signature was cancelled.";
  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
}

type OrderStatus = { filled?: { totalSz: string; avgPx: string }; resting?: unknown; error?: string } | string;

export function useTrade() {
  const w = useWallet();
  const { slippage } = useSettings();
  const { address, login, getExchange, refresh } = w;

  const settle = useCallback(() => {
    refresh();
    setTimeout(refresh, 1500);
  }, [refresh]);

  /** Market order: `margin` USD at `leverage`x, long or short. */
  const open = useCallback(
    async (m: Market, isLong: boolean, margin: number, leverage: number) => {
      if (!address) return login();
      if (status.state === "pending") return;
      const lev = Math.max(1, Math.min(Math.floor(leverage), m.maxLev));
      const notional = margin * lev;
      const side = isLong ? "Long" : "Short";
      if (!(notional >= MIN_NOTIONAL)) {
        return setStatus({ state: "error", msg: `Minimum position is $${MIN_NOTIONAL}. Raise the size or leverage.` });
      }
      const size = formatSize(notional / m.mark, m.szDecimals);
      if (!(Number(size) > 0)) return setStatus({ state: "error", msg: "Size is too small for this market." });

      setStatus({ state: "pending", msg: `${side} ${m.coin} ${lev}x · sending…` });
      try {
        const ex = await getExchange();
        await ex.updateLeverage({ asset: m.idx, isCross: !m.onlyIsolated, leverage: lev });
        const limit = m.mark * (isLong ? 1 + slippage / 100 : 1 - slippage / 100);
        const res = await ex.order({
          orders: [
            { a: m.idx, b: isLong, p: formatPrice(limit, m.szDecimals), s: size, r: false, t: { limit: { tif: "Ioc" } } },
          ],
          grouping: "na",
        });
        report(res.response.data.statuses[0] as OrderStatus, `${side} ${m.coin} ${lev}x`, address);
      } catch (err) {
        setStatus({ state: "error", msg: explain(err), address });
      } finally {
        settle();
      }
    },
    [address, login, getExchange, slippage, settle],
  );

  /** Reduce-only market order closing `fraction` (0-1) of a position. */
  const close = useCallback(
    async (m: Market, pos: Position, fraction: number) => {
      if (!address) return login();
      if (status.state === "pending") return;
      const abs = pos.szi.replace("-", "");
      const size = fraction >= 1 ? abs : formatSize(Math.abs(pos.size) * fraction, m.szDecimals);
      if (!(Number(size) > 0)) return setStatus({ state: "error", msg: "Position is too small to close in part." });
      const buy = pos.size < 0; // closing a short buys back

      setStatus({ state: "pending", msg: `Closing ${Math.round(fraction * 100)}% of ${m.coin} · sending…` });
      try {
        const ex = await getExchange();
        const limit = m.mark * (buy ? 1 + slippage / 100 : 1 - slippage / 100);
        const res = await ex.order({
          orders: [{ a: m.idx, b: buy, p: formatPrice(limit, m.szDecimals), s: size, r: true, t: { limit: { tif: "Ioc" } } }],
          grouping: "na",
        });
        report(res.response.data.statuses[0] as OrderStatus, `Closed ${m.coin}`, address);
      } catch (err) {
        setStatus({ state: "error", msg: explain(err), address });
      } finally {
        settle();
      }
    },
    [address, login, getExchange, slippage, settle],
  );

  return { open, close };
}

function report(st: OrderStatus | undefined, label: string, address: string) {
  if (st && typeof st === "object" && st.filled) {
    setStatus({
      state: "ok",
      msg: `${label} · ${st.filled.totalSz} @ $${fmtPrice(Number(st.filled.avgPx))}`,
      address,
    });
  } else if (st && typeof st === "object" && st.error) {
    setStatus({ state: "error", msg: explain(st.error), address });
  } else {
    setStatus({ state: "error", msg: "Not filled, the price moved. Try again or raise slippage.", address });
  }
}
