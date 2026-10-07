import { getMarkets } from "./hl";
import type { Market } from "./types";

type Sub = (markets: Market[]) => void;

const TICK_MS = 3000;

const g = globalThis as unknown as { __ttHub?: { subs: Set<Sub>; timer: ReturnType<typeof setInterval> | null } };
const hub = (g.__ttHub ??= { subs: new Set(), timer: null });

function tick() {
  getMarkets()
    .then((markets) => hub.subs.forEach((fn) => fn(markets)))
    .catch(() => {});
}

/**
 * One poller for the whole server: every open stream shares it, so upstream
 * cost does not grow with the number of viewers. Stops when nobody is watching.
 */
export function subscribeMarkets(fn: Sub): () => void {
  hub.subs.add(fn);
  if (!hub.timer) hub.timer = setInterval(tick, TICK_MS);
  return () => {
    hub.subs.delete(fn);
    if (hub.subs.size === 0 && hub.timer) {
      clearInterval(hub.timer);
      hub.timer = null;
    }
  };
}
