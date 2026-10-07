import { TradeScreen } from "@/components/TradeScreen";
import { getMarket } from "@/lib/hl";
import type { Market } from "@/lib/types";

export const dynamic = "force-dynamic";

// Shown only if the exchange cannot be reached while rendering; live data replaces it in the browser.
const PLACEHOLDER: Market = { coin: "BTC", idx: 0, szDecimals: 5, maxLev: 40, onlyIsolated: false, mark: 0, prev: 0, vol: 0, funding: 0, oi: 0 };

/** The homepage is the trading screen, opened on BTC. */
export default async function HomePage() {
  const market = (await getMarket("BTC").catch(() => null)) ?? PLACEHOLDER;
  return <TradeScreen initial={market} />;
}