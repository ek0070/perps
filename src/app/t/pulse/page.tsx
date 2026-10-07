import { MarketsPage } from "@/components/markets/MarketsPage";
import { PlayerCardTags } from "@/components/PlayerCardTags";

export const metadata = { title: "Markets" };

/** Share link for the live markets table: posting it on X shows /embed/pulse in the tweet. */
export default function SharePulsePage() {
  return (
    <>
      <PlayerCardTags
        path="/t/pulse"
        playerPath="/embed/pulse"
        imagePath="/api/preview/pulse"
        title="Live perp markets"
        description="Every perp market, live: price, 24h change and volume. Tap a market and trade it inside this post."
      />
      <MarketsPage />
    </>
  );
}