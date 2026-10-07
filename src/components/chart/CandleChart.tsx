"use client";

import { CandlestickSeries, ColorType, createChart, type CandlestickData, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { fmtPrice } from "@/lib/format";
import type { Candle, Interval } from "@/lib/types";

/** Fills its parent. `compact` drops the axes' interactivity for the 480px player. */
export function CandleChart({ coin, interval, compact = false }: { coin: string; interval: Interval; compact?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    setLoaded(false);
    const chart = createChart(el.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.45)",
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: compact ? 10 : 11,
      },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, visible: !compact },
      crosshair: { vertLine: { color: "rgba(255,255,255,0.3)" }, horzLine: { color: "rgba(255,255,255,0.3)" } },
      handleScroll: !compact,
      handleScale: !compact,
    });
    // Black and white: rising candles solid white, falling candles hollow grey.
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#ffffff",
      borderUpColor: "#ffffff",
      wickUpColor: "#ffffff",
      downColor: "#000000",
      borderDownColor: "#8a8a8a",
      wickDownColor: "#8a8a8a",
      priceFormat: { type: "custom", formatter: fmtPrice, minMove: 1e-9 },
    });

    let alive = true;
    let lastTime = 0;
    const toBar = (c: Candle): CandlestickData => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close });

    const load = async () => {
      try {
        const res = await fetch(`/api/candles/${encodeURIComponent(coin)}?interval=${interval}&bars=${compact ? 80 : 300}`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const { items } = (await res.json()) as { items: Candle[] };
        if (!alive || items.length === 0) return;
        if (lastTime === 0) {
          series.setData(items.map(toBar));
          chart.timeScale().fitContent();
          setLoaded(true);
        } else {
          // Only the candles that moved: the open one and any that closed since.
          for (const c of items) if (c.time >= lastTime) series.update(toBar(c));
        }
        lastTime = items[items.length - 1].time;
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);

    return () => {
      alive = false;
      clearInterval(t);
      chart.remove();
    };
  }, [coin, interval, compact]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="absolute inset-0" />
      {!loaded && <div className="skel absolute inset-0 rounded-xl" aria-hidden="true" />}
    </div>
  );
}
