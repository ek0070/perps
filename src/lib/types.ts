export type Market = {
  coin: string;
  /** Hyperliquid asset id (index in the perp universe), used when placing orders. */
  idx: number;
  szDecimals: number;
  maxLev: number;
  onlyIsolated: boolean;
  mark: number;
  /** Price 24h ago. */
  prev: number;
  /** 24h notional volume, USD. */
  vol: number;
  /** Hourly funding rate as a fraction (0.0000125 = 0.00125%/h). */
  funding: number;
  /** Open interest, USD. */
  oi: number;
};

/** Compact wire form of a Market for the all-markets stream. */
export type MarketTuple = [string, number, number, number, 0 | 1, number, number, number, number, number];

export function toTuple(m: Market): MarketTuple {
  return [m.coin, m.idx, m.szDecimals, m.maxLev, m.onlyIsolated ? 1 : 0, m.mark, m.prev, m.vol, m.funding, m.oi];
}

export function fromTuple(t: MarketTuple): Market {
  return {
    coin: t[0],
    idx: t[1],
    szDecimals: t[2],
    maxLev: t[3],
    onlyIsolated: t[4] === 1,
    mark: t[5],
    prev: t[6],
    vol: t[7],
    funding: t[8],
    oi: t[9],
  };
}

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export type Trade = { tid: number; time: number; px: number; sz: number; side: "B" | "A" };

export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];
