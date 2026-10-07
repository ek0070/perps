export function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  if (n <= 0) return "0";
  // four significant digits for sub-dollar prices
  return n.toFixed(Math.min(10, 3 - Math.floor(Math.log10(n))));
}

export function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return "";
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(2)}`;
}

export function fmtPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "";
  return `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(digits)}%`;
}

export function changePct(mark: number, prev: number): number {
  return prev > 0 ? (mark / prev - 1) * 100 : 0;
}

/** Hourly funding as a percentage string, e.g. "+0.0013%". */
export function fmtFunding(f: number): string {
  return fmtPct(f * 100, 4);
}

export function fundingApr(f: number): number {
  return f * 24 * 365 * 100;
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function fmtAge(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
