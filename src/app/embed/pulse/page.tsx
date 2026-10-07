import { PulseFeed } from "@/components/markets/PulseFeed";

export const metadata = { title: "Pulse", robots: { index: false } };

/** The live feed as a 480x480 player. Fills the iframe, only the list scrolls. */
export default function EmbedPulsePage() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <PulseFeed embed />
    </main>
  );
}
