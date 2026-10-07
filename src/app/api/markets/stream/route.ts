import { getMarket, getMarkets } from "@/lib/hl";
import { subscribeMarkets } from "@/lib/hub";
import { toTuple, type Market } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Server-sent events. `?coin=BTC` streams that one market as an object;
 * without it, every market as compact tuples. Nothing is sent when nothing changed.
 */
export async function GET(req: Request) {
  const coinParam = new URL(req.url).searchParams.get("coin");
  const coin = coinParam ? (await getMarket(coinParam).catch(() => null))?.coin : null;
  if (coinParam && !coin) return new Response("unknown market", { status: 404 });

  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let last = "";
      let closed = false;
      const send = (markets: Market[]) => {
        if (closed) return;
        const one = coin ? markets.find((m) => m.coin === coin) : null;
        const payload = coin ? JSON.stringify(one ?? null) : JSON.stringify(markets.map(toTuple));
        try {
          if (payload === last) controller.enqueue(enc.encode(": keep-alive\n\n"));
          else controller.enqueue(enc.encode(`data: ${payload}\n\n`));
          last = payload;
        } catch {
          cleanup();
        }
      };
      const unsubscribe = subscribeMarkets(send);
      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cleanup);
      getMarkets().then(send).catch(() => {});
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
