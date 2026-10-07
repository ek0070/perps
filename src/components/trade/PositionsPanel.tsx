"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import type { Market } from "@/lib/types";
import { Num } from "../ui/Num";
import { useWallet } from "../wallet/WalletContext";
import { useTrade, useTradeStatus } from "./useTrade";

type Tab = "positions" | "orders" | "account";

const th = "h-8 whitespace-nowrap px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted";
const td = "num h-10 whitespace-nowrap px-3 text-xs";

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex h-24 items-center justify-center text-xs text-muted">{children}</div>;
}

/** The bottom panel of the trading screen: open positions, resting orders and account summary. */
export function PositionsPanel({ markets }: { markets: Market[] | null }) {
  const { address, account, login } = useWallet();
  const { close, cancel } = useTrade();
  const busy = useTradeStatus().state === "pending";
  const [tab, setTab] = useState<Tab>("positions");
  const byCoin = useMemo(() => new Map((markets ?? []).map((m) => [m.coin, m])), [markets]);

  const positions = account?.positions ?? [];
  const orders = account?.orders ?? [];
  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`h-10 border-b-2 px-1 text-xs font-semibold transition ${tab === key ? "border-accent text-white" : "border-transparent text-muted hover:text-white"}`}
    >
      {label}
    </button>
  );
  const action = "h-7 rounded-md border border-line px-2.5 text-[11px] font-semibold text-white/85 transition hover:border-accent hover:text-white disabled:opacity-40";

  return (
    <section className="bg-panel">
      <div className="flex gap-5 border-b border-line px-3">
        {tabBtn("positions", `Positions (${positions.length})`)}
        {tabBtn("orders", `Open orders (${orders.length})`)}
        {tabBtn("account", "Account")}
      </div>

      <div className="min-h-32 overflow-x-auto">
        {!address ? (
          <Empty>
            <button onClick={login} className="font-semibold text-accent hover:text-white">
              Log in
            </button>
            <span className="ml-1">to see your positions and orders.</span>
          </Empty>
        ) : !account ? (
          <div className="p-3">
            <span className="skel h-8 w-full" />
          </div>
        ) : tab === "positions" ? (
          positions.length === 0 ? (
            <Empty>No open positions.</Empty>
          ) : (
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  {["Market", "Size", "Value", "Entry", "Mark", "PnL (ROE)", "Liq. price", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const m = byCoin.get(p.coin);
                  const long = p.size > 0;
                  return (
                    <tr key={p.coin} className="border-t border-line/60">
                      <td className={td}>
                        <Link href={`/t/${encodeURIComponent(p.coin)}`} className="font-sans font-bold hover:text-accent">
                          {p.coin}
                        </Link>
                        <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${long ? "bg-long/15 text-long" : "bg-short/15 text-short"}`}>
                          {long ? "LONG" : "SHORT"} {p.leverage}x
                        </span>
                      </td>
                      <td className={`${td} ${long ? "text-long" : "text-short"}`}>{Math.abs(p.size)}</td>
                      <td className={td}>{fmtUsd(p.value)}</td>
                      <td className={td}>{fmtPrice(p.entryPx)}</td>
                      <td className={td}>
                        <Num value={m ? fmtPrice(m.mark) : null} />
                      </td>
                      <td className={`${td} ${p.pnl >= 0 ? "text-long" : "text-short"}`}>
                        <Num value={`${p.pnl >= 0 ? "+" : "-"}${fmtUsd(Math.abs(p.pnl))} (${fmtPct(p.roe, 1)})`} />
                      </td>
                      <td className={td}>{p.liqPx ? fmtPrice(p.liqPx) : "None"}</td>
                      <td className={`${td} text-right`}>
                        <span className="flex justify-end gap-1.5 font-sans">
                          <button disabled={busy || !m} onClick={() => m && close(m, p, 0.5)} className={action}>
                            Close 50%
                          </button>
                          <button disabled={busy || !m} onClick={() => m && close(m, p, 1)} className={action}>
                            Close
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : tab === "orders" ? (
          orders.length === 0 ? (
            <Empty>No open orders.</Empty>
          ) : (
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  {["Market", "Side", "Price", "Size", "Value", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const m = byCoin.get(o.coin);
                  return (
                    <tr key={o.oid} className="border-t border-line/60">
                      <td className={`${td} font-sans font-bold`}>{o.coin}</td>
                      <td className={`${td} ${o.isBuy ? "text-long" : "text-short"}`}>
                        {o.isBuy ? "Buy" : "Sell"}
                        {o.reduceOnly ? " (reduce)" : ""}
                      </td>
                      <td className={td}>{fmtPrice(o.px)}</td>
                      <td className={td}>{o.sz}</td>
                      <td className={td}>{fmtUsd(o.px * o.sz)}</td>
                      <td className={`${td} text-right`}>
                        <button disabled={busy || !m} onClick={() => m && cancel(m, o.oid)} className={`${action} font-sans`}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {[
              ["Account value", fmtUsd(account.equity)],
              ["Available", fmtUsd(account.withdrawable)],
              ["Margin used", fmtUsd(account.marginUsed)],
              ["Unrealized PnL", fmtUsd(positions.reduce((s, p) => s + p.pnl, 0))],
            ].map(([label, value]) => (
              <div key={label} className="bg-panel px-3 py-4">
                <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
                <div className="mt-1 text-base font-bold">
                  <Num value={value} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
