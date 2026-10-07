"use client";

import { useSyncExternalStore } from "react";

export type Settings = {
  /** Max slippage for market orders, percent. */
  slippage: number;
  /** Default leverage, capped per market. */
  leverage: number;
  /** Margin in USD used by the quick-long button in the lists. */
  quick: number;
};

export const DEFAULTS: Settings = { slippage: 1, leverage: 5, quick: 10 };
export const SLIPPAGE_OPTIONS = [0.5, 1, 3, 5];
export const QUICK_OPTIONS = [10, 25, 50, 100];

const KEY = "tt-settings";
let current: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {}
}

export function setSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {}
  listeners.forEach((fn) => fn());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => {
      load();
      return current;
    },
    () => DEFAULTS,
  );
}
