import { getBook, getMarket } from "@/lib/hl";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ coin: string }> }) {
  const { coin } = await params;
  try {
    const market = await getMarket(coin);
    if (!market) return Response.json({ error: "Unknown market." }, { status: 404 });
    return Response.json(await getBook(market.coin), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Order book is unavailable right now." }, { status: 502 });
  }
}