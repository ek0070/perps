"use client";

import { useEffect, useState } from "react";
import { fmtPrice } from "@/lib/format";
import type { Book, BookLevel } from "@/lib/types";

const DEPTH = 11;
const GRID = "grid grid-cols-[1fr_1fr_1fr] items-center px-3";

function fmtSz(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
  if (n >= 100) return n.toFixed(1);
  return n.toFixed(Math.min(5, Math.max(2, 4 - Math.floor(Math.log10(Math.max(n, 1e-9))))));
}

type Row = BookLevel & { total: number };

function withTotals(levels: BookLevel[]): Row[] {
  let total = 0;
  return levels.slice(0, DEPTH).map((l) => ({ ...l, total: (total += l.sz) }));
}

function Side({ rows, max, side, onPick }: { rows: Row[] | null; max: number; side: "bid" | "ask"; onPick?: (px: number) => void }) {
  const padded: (Row | null)[] = rows ? [...rows, ...Array(Math.max(0, DEPTH - rows.length)).fill(null)] : Array(DEPTH).fill(null);
  // Asks are drawn with the best (lowest) price next to the spread.
  const ordered = side === "ask" ? [...padded].reverse() : padded;
  return (
    <ul>
      {ordered.map((r, i) => (
        <li key={i} className="relative h-[22px]">
          {r && (
            <>
              <span
                className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-long/15" : "bg-short/15"}`}
                style={{ width: `${Math.min(100, (r.total / max) * 100)}%` }}
              />
              <button
                type="button"
                onClick={() => onPick?.(r.px)}
                className={`num relative h-full w-full text-left text-[11px] hover:bg-white/5 ${GRID}`}
              >
                <span className={side === "bid" ? "text-long" : "text-short"}>{fmtPrice(r.px)}</span>
                <span className="text-right text-white/80">{fmtSz(r.sz)}</span>
                <span className="text-right text-muted">{fmtSz(r.total)}</span>
              </button>
            </>
          )}
          {!rows && <span className="skel absolute inset-x-3 top-1.5 h-2.5" />}
        </li>
      ))}
    </ul>
  );
}

/** Live order book with cumulative depth bars. Clicking a level sends its price to the order form. */
export function OrderBook({ coin, mark, onPick }: { coin: string; mark: number; onPick?: (px: number) => void }) {
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    let alive = true;
    setBook(null);
    const load = async () => {
      try {
        const res = await fetch(`/api/book/${encodeURIComponent(coin)}`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const next = (await res.json()) as Book;
        if (alive && next.bids) setBook(next);
      } catch {}
    };
    load();
    const t = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [coin]);

  const bids = book ? withTotals(book.bids) : null;
  const asks = book ? withTotals(book.asks) : null;
  const max = Math.max(bids?.at(-1)?.total ?? 0, asks?.at(-1)?.total ?? 0, 1e-12);
  const bestBid = book?.bids[0]?.px;
  const bestAsk = book?.asks[0]?.px;
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null;

  return (
    <div>
      <div className={`h-7 text-[10px] uppercase tracking-wider text-muted ${GRID}`}>
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>
      <Side rows={asks} max={max} side="ask" onPick={onPick} />
      <div className="num flex h-8 items-center justify-between border-y border-line bg-raised/60 px-3 text-xs">
        <span className="text-sm font-bold text-white">{mark > 0 ? fmtPrice(mark) : ""}</span>
        <span className="text-muted">
          Spread {spread !== null && bestAsk ? `${fmtPrice(spread)} (${((spread / bestAsk) * 100).toFixed(3)}%)` : ""}
        </span>
      </div>
      <Side rows={bids} max={max} side="bid" onPick={onPick} />
    </div>
  );
}
