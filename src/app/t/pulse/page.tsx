import { Trenches } from "@/components/markets/Trenches";
import { PlayerCardTags } from "@/components/PlayerCardTags";

export const metadata = { title: "Pulse" };

/** Share link for the whole live feed: posting it on X shows /embed/pulse in the tweet. */
export default function SharePulsePage() {
  return (
    <>
      <PlayerCardTags
        path="/t/pulse"
        playerPath="/embed/pulse"
        imagePath="/api/preview/pulse"
        title="Pulse: live perps"
        description="Movers, volume and funding across every perp market, live. Tap a market and trade it inside this post."
      />
      <Trenches />
    </>
  );
}
