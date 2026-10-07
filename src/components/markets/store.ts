"use client";

import { useSyncExternalStore } from "react";
import { fromTuple, type Market, type MarketTuple } from "@/lib/types";

/**
 * Live market data for the browser. One EventSource per scope ("all" or a
 * single coin) shared by every component on the page; polling is the fallback.
 * Unchanged markets keep their object identity, so memoised rows whose numbers
 * did not move are never re-rendered.
 */
type Store = {
  list: Market[] | null;
  byCoin: Map<string, Market>;
  listeners: Set<() => void>;
  es: EventSource | null;
  poll: ReturnType<typeof setInterval> | null;
};

const stores = new Map<string, Store>();

function getStore(scope: string): Store {
  let s = stores.get(scope);
  if (!s) {
    s = { list: null, byCoin: new Map(), listeners: new Set(), es: null, poll: null };
    stores.set(scope, s);
  }
  return s;
}

function same(a: Market, b: Market) {
  return (
    a.mark === b.mark &&
    a.prev === b.prev &&
    a.vol === b.vol &&
    a.funding === b.funding &&
    a.oi === b.oi &&
    a.maxLev === b.maxLev &&
    a.idx === b.idx
  );
}

function apply(s: Store, incoming: Market[]) {
  let changed = s.list === null || s.list.length !== incoming.length;
  const next = incoming.map((m) => {
    const old = s.byCoin.get(m.coin);
    if (old && same(old, m)) return old;
    changed = true;
    return m;
  });
  if (!changed) return;
  s.list = next;
  s.byCoin = new Map(next.map((m) => [m.coin, m]));
  s.listeners.forEach((fn) => fn());
}

function connect(scope: string, s: Store) {
  const single = scope !== "all";
  const fetchOnce = async () => {
    try {
      const res = await fetch("/api/markets", { cache: "no-store" });
      if (!res.ok) return;
      const { markets } = (await res.json()) as { markets: Market[] };
      apply(s, single ? markets.filter((m) => m.coin === scope) : markets);
    } catch {}
  };
  const startPolling = () => {
    if (!s.poll) s.poll = setInterval(fetchOnce, 5000);
  };

  if (typeof EventSource === "undefined") {
    fetchOnce();
    startPolling();
    return;
  }
  const es = new EventSource(single ? `/api/markets/stream?coin=${encodeURIComponent(scope)}` : "/api/markets/stream");
  s.es = es;
  es.onmessage = (ev) => {
    if (s.poll) {
      clearInterval(s.poll);
      s.poll = null;
    }
    try {
      const data = JSON.parse(ev.data);
      if (single) {
        if (data) apply(s, [data as Market]);
      } else {
        apply(s, (data as MarketTuple[]).map(fromTuple));
      }
    } catch {}
  };
  // EventSource reconnects by itself; poll in the meantime so numbers keep moving.
  es.onerror = startPolling;
}

function subscribe(scope: string, fn: () => void) {
  const s = getStore(scope);
  s.listeners.add(fn);
  if (s.listeners.size === 1) connect(scope, s);
  return () => {
    s.listeners.delete(fn);
    if (s.listeners.size === 0) {
      s.es?.close();
      s.es = null;
      if (s.poll) clearInterval(s.poll);
      s.poll = null;
    }
  };
}

/** Every market, live. null until the first data arrives. */
export function useMarkets(): Market[] | null {
  return useSyncExternalStore(
    (fn) => subscribe("all", fn),
    () => getStore("all").list,
    () => null,
  );
}

/** One market, live, seeded with the server-rendered value so there is no blank first paint. */
export function useMarket(initial: Market): Market {
  const scope = initial.coin;
  return useSyncExternalStore(
    (fn) => subscribe(scope, fn),
    () => getStore(scope).byCoin.get(scope) ?? initial,
    () => initial,
  );
}
