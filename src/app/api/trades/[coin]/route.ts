import { getMarket, getTrades } from "@/lib/hl";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ coin: string }> }) {
  const { coin } = await params;
  try {
    const market = await getMarket(coin);
    if (!market) return Response.json({ error: "Unknown market." }, { status: 404 });
    return Response.json(
      { coin: market.coin, items: await getTrades(market.coin) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Trades are unavailable right now." }, { status: 502 });
  }
}
