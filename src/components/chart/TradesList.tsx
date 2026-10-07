"use client";

import { memo, useEffect, useRef, useState } from "react";
import { fmtPrice } from "@/lib/format";
import type { Trade } from "@/lib/types";

const ROWS = 24;
const GRID = "grid grid-cols-[1fr_1fr_4.5rem] items-center px-3";

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", { hour12: false });
}

const Row = memo(function Row({ t, fresh }: { t: Trade; fresh: boolean }) {
  return (
    <li className={`num h-[22px] text-[11px] ${GRID} ${fresh ? "flash" : ""}`}>
      <span className={t.side === "B" ? "text-long" : "text-short"}>{fmtPrice(t.px)}</span>
      <span className="text-right text-white/80">{t.sz}</span>
      <span className="text-right text-muted">{clock(t.time)}</span>
    </li>
  );
});

/** Live tape: green buys, red sells. Prints accumulate across polls up to a fixed row count. */
export function TradesList({ coin }: { coin: string }) {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const all = useRef<Trade[]>([]);
  const fresh = useRef<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    all.current = [];
    setTrades(null);
    const load = async () => {
      try {
        const res = await fetch(`/api/trades/${encodeURIComponent(coin)}`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const { items } = (await res.json()) as { items: Trade[] };
        if (!alive) return;
        const known = new Set(all.current.map((t) => t.tid));
        const added = items.filter((t) => !known.has(t.tid));
        fresh.current = new Set(all.current.length ? added.map((t) => t.tid) : []);
        if (added.length || all.current.length === 0) {
          all.current = [...added, ...all.current].sort((a, b) => b.time - a.time || b.tid - a.tid).slice(0, ROWS);
          setTrades(all.current);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [coin]);

  return (
    <div>
      <div className={`h-7 text-[10px] uppercase tracking-wider text-muted ${GRID}`}>
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <ul style={{ height: ROWS * 22 }} className="overflow-hidden">
        {trades === null
          ? Array.from({ length: ROWS }, (_, i) => (
              <li key={i} className="flex h-[22px] items-center px-3">
                <span className="skel h-3 w-full" />
              </li>
            ))
          : trades.map((t) => <Row key={t.tid} t={t} fresh={fresh.current.has(t.tid)} />)}
      </ul>
    </div>
  );
}
