import { cached } from "./cache";
import type { Book, Candle, Interval, Market, Trade } from "./types";

const API = "https://api.hyperliquid.xyz/info";

async function info<T>(body: unknown): Promise<T> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`hyperliquid ${res.status}`);
  return res.json() as Promise<T>;
}

type Universe = { name: string; szDecimals: number; maxLeverage: number; onlyIsolated?: boolean; isDelisted?: boolean };
type AssetCtx = {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string | null;
  midPx: string | null;
  oraclePx: string;
};

/** Every live perp market. One upstream call per 2s no matter how many visitors. */
export function getMarkets(): Promise<Market[]> {
  return cached("markets", 2000, async () => {
    const [meta, ctxs] = await info<[{ universe: Universe[] }, AssetCtx[]]>({ type: "metaAndAssetCtxs" });
    const out: Market[] = [];
    meta.universe.forEach((u, idx) => {
      const c = ctxs[idx];
      if (!c || u.isDelisted) return;
      const mark = Number(c.markPx ?? c.midPx ?? c.oraclePx);
      if (!(mark > 0)) return;
      out.push({
        coin: u.name,
        idx,
        szDecimals: u.szDecimals,
        maxLev: u.maxLeverage,
        onlyIsolated: !!u.onlyIsolated,
        mark,
        prev: Number(c.prevDayPx) || mark,
        vol: Math.round(Number(c.dayNtlVlm) || 0),
        funding: Number(c.funding) || 0,
        oi: Math.round((Number(c.openInterest) || 0) * mark),
      });
    });
    return out;
  });
}

/** Resolves a ticker from a URL (any case) to its live market. */
export async function getMarket(input: string): Promise<Market | null> {
  let name = input;
  try {
    name = decodeURIComponent(input);
  } catch {}
  name = name.trim();
  if (!name || name.length > 24) return null;
  const markets = await getMarkets();
  return (
    markets.find((m) => m.coin === name) ?? markets.find((m) => m.coin.toLowerCase() === name.toLowerCase()) ?? null
  );
}

const STEP_MS: Record<Interval, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
};

type RawCandle = { t: number; o: string; h: string; l: string; c: string; v: string };

export function getCandles(coin: string, interval: Interval, bars: number): Promise<Candle[]> {
  return cached(`candles:${coin}:${interval}:${bars}`, 5000, async () => {
    const endTime = Date.now();
    const raw = await info<RawCandle[]>({
      type: "candleSnapshot",
      req: { coin, interval, startTime: endTime - STEP_MS[interval] * bars, endTime },
    });
    return raw.map((k) => ({
      time: Math.floor(k.t / 1000),
      open: Number(k.o),
      high: Number(k.h),
      low: Number(k.l),
      close: Number(k.c),
      volume: Number(k.v),
    }));
  });
}

type RawTrade = { side: "B" | "A"; px: string; sz: string; time: number; tid: number };

export function getTrades(coin: string): Promise<Trade[]> {
  return cached(`trades:${coin}`, 3000, async () => {
    const raw = await info<RawTrade[]>({ type: "recentTrades", coin });
    return raw
      .map((t) => ({ tid: t.tid, time: t.time, px: Number(t.px), sz: Number(t.sz), side: t.side }))
      .sort((a, b) => b.time - a.time || b.tid - a.tid)
      .slice(0, 40);
  });
}

type RawLevel = { px: string; sz: string };

/** Top of the order book: best 14 bids and asks. */
export function getBook(coin: string): Promise<Book> {
  return cached(`book:${coin}`, 1000, async () => {
    const raw = await info<{ levels: [RawLevel[], RawLevel[]] }>({ type: "l2Book", coin });
    const side = (levels: RawLevel[]) => levels.slice(0, 14).map((l) => ({ px: Number(l.px), sz: Number(l.sz) }));
    return { bids: side(raw.levels[0]), asks: side(raw.levels[1]) };
  });
}