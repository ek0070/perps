"use client";

import { useEffect, useRef, useState } from "react";

/** Fixed-size icon slot: the letter placeholder holds the space, the image fades in over it. */
export function CoinIcon({ coin, size = 28 }: { coin: string; size?: number }) {
  const [state, setState] = useState<"loading" | "ok" | "failed">("loading");
  const img = useRef<HTMLImageElement>(null);
  const letter = coin.replace(/^k(?=[A-Z])/, "").charAt(0);

  // A server-rendered image can finish loading before React attaches onLoad.
  useEffect(() => {
    const el = img.current;
    if (el?.complete) setState(el.naturalWidth > 0 ? "ok" : "failed");
  }, []);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 font-display font-bold text-white/70"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {state !== "ok" && letter}
      {state !== "failed" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={`https://app.hyperliquid.xyz/coins/${encodeURIComponent(coin)}.svg`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onLoad={() => setState("ok")}
          onError={() => setState("failed")}
          // White disc behind the artwork: several icons are a dark glyph on transparent.
          className={`absolute inset-0 h-full w-full bg-white object-cover transition-opacity duration-200 ${state === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </span>
  );
}
