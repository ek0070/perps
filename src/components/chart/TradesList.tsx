"use client";

import { memo, useEffect, useRef, useState } from "react";
import { fmtAge, fmtPrice, fmtUsd } from "@/lib/format";
import type { Trade } from "@/lib/types";

const ROWS = 10; // what the exchange returns per poll

const Row = memo(function Row({ t, fresh }: { t: Trade; fresh: boolean }) {
  const buy = t.side === "B";
  return (
    <li className={`num grid h-6 grid-cols-[3rem_1fr_1fr_2.5rem] items-center text-[11px] ${fresh ? "flash" : ""} ${buy ? "text-white" : "text-white/50"}`}>
      <span className="font-bold uppercase">{buy ? "Buy" : "Sell"}</span>
      <span className="text-right">{fmtPrice(t.px)}</span>
      <span className="text-right">{fmtUsd(t.px * t.sz)}</span>
      <span className="text-right text-white/35">{fmtAge(t.time)}</span>
    </li>
  );
});

/** Live tape. Fixed row height and a fixed row count, so new prints never move the page. */
export function TradesList({ coin }: { coin: string }) {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const seen = useRef<Set<number> | null>(null);
  const fresh = useRef<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    seen.current = null;
    setTrades(null);
    const load = async () => {
      try {
        const res = await fetch(`/api/trades/${encodeURIComponent(coin)}`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const { items } = (await res.json()) as { items: Trade[] };
        if (!alive) return;
        const next = items.slice(0, ROWS);
        fresh.current = new Set(seen.current ? next.filter((t) => !seen.current!.has(t.tid)).map((t) => t.tid) : []);
        seen.current = new Set(next.map((t) => t.tid));
        setTrades(next);
      } catch {}
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [coin]);

  return (
    <div>
      <div className="grid h-6 grid-cols-[3rem_1fr_1fr_2.5rem] items-center text-[10px] uppercase tracking-wider text-white/35">
        <span>Side</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Age</span>
      </div>
      <ul style={{ height: ROWS * 24 }} className="overflow-hidden">
        {trades === null
          ? Array.from({ length: ROWS }, (_, i) => (
              <li key={i} className="flex h-6 items-center">
                <span className="skel h-3 w-full" />
              </li>
            ))
          : trades.map((t) => <Row key={t.tid} t={t} fresh={fresh.current.has(t.tid)} />)}
      </ul>
    </div>
  );
}
