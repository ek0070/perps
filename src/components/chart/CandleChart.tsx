"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { fmtPrice } from "@/lib/format";
import type { Candle, Interval } from "@/lib/types";

const UP = "#16d9a4";
const DOWN = "#ff4d74";

function fmtVol(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

/**
 * Exchange-style chart: green/red candles, volume bars along the bottom, a
 * live last-price line and an OHLC readout that follows the crosshair.
 * Fills its parent. `compact` is the 480px player: no time axis, no panning.
 */
export function CandleChart({ coin, interval, compact = false }: { coin: string; interval: Interval; compact?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const legend = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    setLoaded(false);
    const chart = createChart(el.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a92b2",
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: compact ? 10 : 11,
      },
      grid: { vertLines: { color: "rgba(138,146,178,0.07)" }, horzLines: { color: "rgba(138,146,178,0.07)" } },
      rightPriceScale: { borderColor: "#232842", scaleMargins: { top: 0.08, bottom: compact ? 0.2 : 0.24 } },
      timeScale: { borderColor: "#232842", timeVisible: true, secondsVisible: false, visible: !compact, rightOffset: compact ? 2 : 6 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(139,92,246,0.6)", style: LineStyle.Dashed, labelBackgroundColor: "#8b5cf6" },
        horzLine: { color: "rgba(139,92,246,0.6)", style: LineStyle.Dashed, labelBackgroundColor: "#8b5cf6" },
      },
      handleScroll: !compact,
      handleScale: !compact,
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      borderUpColor: UP,
      wickUpColor: UP,
      downColor: DOWN,
      borderDownColor: DOWN,
      wickDownColor: DOWN,
      priceLineStyle: LineStyle.Dotted,
      priceFormat: { type: "custom", formatter: fmtPrice, minMove: 1e-9 },
    });
    const volume = chart.addSeries(HistogramSeries, { priceScaleId: "vol", priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: compact ? 0.84 : 0.82, bottom: 0 }, visible: false });

    let alive = true;
    let lastTime = 0;
    const byTime = new Map<number, Candle>();
    const toBar = (c: Candle): CandlestickData => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close });
    const toVol = (c: Candle): HistogramData => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? "rgba(22,217,164,0.38)" : "rgba(255,77,116,0.38)",
    });

    const showLegend = (c: Candle | undefined) => {
      if (!legend.current || !c) return;
      const up = c.close >= c.open;
      const chg = c.open > 0 ? ((c.close / c.open - 1) * 100).toFixed(2) : "0.00";
      const col = up ? UP : DOWN;
      legend.current.innerHTML =
        `<span>O <b style="color:${col}">${fmtPrice(c.open)}</b></span>` +
        `<span>H <b style="color:${col}">${fmtPrice(c.high)}</b></span>` +
        `<span>L <b style="color:${col}">${fmtPrice(c.low)}</b></span>` +
        `<span>C <b style="color:${col}">${fmtPrice(c.close)}</b></span>` +
        `<span style="color:${col}">${up ? "+" : ""}${chg}%</span>` +
        `<span>Vol <b style="color:#eef0fa">${fmtVol(c.volume)}</b></span>`;
    };
    chart.subscribeCrosshairMove((p) => {
      showLegend(typeof p.time === "number" ? byTime.get(p.time) : byTime.get(lastTime));
    });

    const load = async () => {
      try {
        const res = await fetch(`/api/candles/${encodeURIComponent(coin)}?interval=${interval}&bars=${compact ? 70 : 300}`, { cache: "no-store" });
        if (!res.ok || !alive) return;
        const { items } = (await res.json()) as { items: Candle[] };
        if (!alive || items.length === 0) return;
        if (lastTime === 0) {
          candles.setData(items.map(toBar));
          volume.setData(items.map(toVol));
          if (compact) chart.timeScale().fitContent();
          else chart.timeScale().setVisibleLogicalRange({ from: items.length - 110, to: items.length + 5 });
          items.forEach((c) => byTime.set(c.time, c));
          setLoaded(true);
        } else {
          // Only the candles that moved: the open one and any that closed since.
          for (const c of items) {
            if (c.time < lastTime) continue;
            candles.update(toBar(c));
            volume.update(toVol(c));
            byTime.set(c.time, c);
          }
        }
        lastTime = items[items.length - 1].time;
        showLegend(byTime.get(lastTime));
      } catch {}
    };
    load();
    const t = setInterval(load, 4000);

    return () => {
      alive = false;
      clearInterval(t);
      chart.remove();
    };
  }, [coin, interval, compact]);

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="absolute inset-0" />
      {!compact && (
        <div ref={legend} className="num pointer-events-none absolute left-2 top-1.5 z-10 flex flex-wrap gap-x-3 text-[11px] text-muted [&_b]:font-medium" />
      )}
      {!loaded && <div className="skel absolute inset-0 rounded-lg" aria-hidden="true" />}
    </div>
  );
}
