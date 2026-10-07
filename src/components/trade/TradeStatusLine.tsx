"use client";

import { useEffect } from "react";
import { clearTradeStatus, useTradeStatus } from "./useTrade";

/**
 * Pending / filled / failed, with a link to the account on Hyperliquid's explorer.
 * `floating` pins it to the bottom of the screen (used by the lists); otherwise
 * it is an inline row of fixed height so nothing shifts when it appears.
 */
export function TradeStatusLine({ floating = false }: { floating?: boolean }) {
  const status = useTradeStatus();

  useEffect(() => {
    if (status.state !== "ok" && status.state !== "error") return;
    const t = setTimeout(clearTradeStatus, 9000);
    return () => clearTimeout(t);
  }, [status]);

  const body =
    status.state === "idle" ? null : (
      <>
        <span className="flex min-w-0 items-center gap-2">
          {status.state === "pending" ? (
            <span className="live-dot shrink-0" />
          ) : (
            <span className="shrink-0 font-bold uppercase tracking-wider">{status.state === "ok" ? "Filled" : "Failed"}</span>
          )}
          <span className={`truncate ${status.state === "error" ? "text-white/70" : "text-white"}`} title={status.msg}>
            {status.msg}
          </span>
        </span>
        {status.address && status.state !== "pending" && (
          <a
            href={`https://app.hyperliquid.xyz/explorer/address/${status.address}`}
            target="_blank"
            rel="noopener"
            className="shrink-0 text-white/60 underline underline-offset-2 transition hover:text-white"
          >
            Explorer
          </a>
        )}
      </>
    );

  if (floating) {
    if (!body) return null;
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3">
        <div className="pointer-events-auto flex h-9 max-w-full items-center justify-between gap-3 rounded-xl border border-white/25 bg-black px-3 text-xs shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          {body}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-5 items-center justify-between gap-3 text-[11px]" aria-live="polite">
      {body}
    </div>
  );
}
