import { getMarkets } from "@/lib/hl";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ markets: await getMarkets() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Market data is unavailable right now." }, { status: 502 });
  }
}
