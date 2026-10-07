"use client";

import { useMemo, useState } from "react";
import { SITE_URL } from "@/lib/site";
import { useMarkets } from "../markets/store";

/** Type a ticker, get the /t/<coin> link to post. Validated against the live market list. */
export function MakeLink() {
  const markets = useMarkets();
  const [input, setInput] = useState("");
  const [coin, setCoin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const query = input.trim().replace(/^\$/, "").replace(/-?perp$/i, "");
  const suggestions = useMemo(() => {
    if (!markets || !query || coin) return [];
    const q = query.toLowerCase();
    return markets
      .filter((m) => m.coin.toLowerCase().includes(q))
      .sort((a, b) => Number(b.coin.toLowerCase().startsWith(q)) - Number(a.coin.toLowerCase().startsWith(q)) || b.vol - a.vol)
      .slice(0, 6)
      .map((m) => m.coin);
  }, [markets, query, coin]);

  const pick = (name: string) => {
    setCoin(name);
    setInput(name);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCoin(null);
    if (!query) return setError("Type a ticker first, for example BTC.");
    if (query.length > 20 || /^0x[0-9a-f]{10,}$/i.test(query)) {
      return setError("Perps are listed by ticker, not by contract address. Type the ticker, for example BTC or SOL.");
    }
    if (!markets) return setError("Still loading the market list. Try again in a second.");
    const hit = markets.find((m) => m.coin === query) ?? markets.find((m) => m.coin.toLowerCase() === query.toLowerCase());
    if (!hit) {
      return setError(
        suggestions.length
          ? `There is no perp called "${query}". Did you mean ${suggestions.slice(0, 3).join(", ")}?`
          : `There is no perp called "${query}". Try BTC, ETH, SOL or HYPE.`,
      );
    }
    pick(hit.coin);
  };

  const link = coin ? `${SITE_URL}/t/${encodeURIComponent(coin)}` : "";
  const copy = () =>
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });

  return (
    <div className="rounded-3xl border border-line bg-panel p-5 shadow-[0_0_80px_rgba(139,92,246,0.06)] sm:p-8">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setCoin(null);
            setError(null);
          }}
          placeholder="Ticker, e.g. BTC"
          aria-label="Perp ticker"
          autoComplete="off"
          spellCheck={false}
          className="h-13 min-w-0 shrink-0 rounded-2xl border sm:flex-1 border-line bg-transparent px-4 font-mono text-base outline-none transition placeholder:text-muted focus:border-accent"
        />
        <button className="h-13 shrink-0 rounded-2xl btn-brand px-6 font-semibold text-white transition">Make link</button>
      </form>

      <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2">
        {error ? (
          <p className="text-sm text-white/70" role="alert">
            {error}
          </p>
        ) : (
          suggestions.map((s) => (
            <button
              key={s}
              onClick={() => pick(s)}
              className="h-8 rounded-lg border border-line px-3 font-mono text-xs text-white/80 transition hover:border-accent hover:text-white"
            >
              {s}
            </button>
          ))
        )}
      </div>

      {coin && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-line p-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate px-1 font-mono text-sm">{link}</code>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="h-10 flex-1 rounded-xl border border-line px-4 text-sm font-semibold transition hover:border-accent hover:text-white sm:flex-none"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={`https://x.com/intent/post?url=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noopener"
              className="h-10 flex-1 whitespace-nowrap rounded-xl btn-brand px-4 text-center text-sm font-semibold leading-10 text-white transition sm:flex-none"
            >
              Post to X
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
