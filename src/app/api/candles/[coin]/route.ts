import { getCandles, getMarket } from "@/lib/hl";
import { INTERVALS, type Interval } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ coin: string }> }) {
  const { coin } = await params;
  const q = new URL(req.url).searchParams;
  const interval = (INTERVALS as readonly string[]).includes(q.get("interval") ?? "")
    ? (q.get("interval") as Interval)
    : "5m";
  const bars = Math.min(500, Math.max(20, Number(q.get("bars")) || 200));
  try {
    const market = await getMarket(coin);
    if (!market) return Response.json({ error: "Unknown market." }, { status: 404 });
    return Response.json(
      { coin: market.coin, interval, items: await getCandles(market.coin, interval, bars) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Chart data is unavailable right now." }, { status: 502 });
  }
}
