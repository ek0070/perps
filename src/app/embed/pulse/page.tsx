import { MarketsPage } from "@/components/markets/MarketsPage";

export const metadata = { title: "Markets", robots: { index: false } };

/** The live markets table as a 480x480 player. Fills the iframe, only the list scrolls. */
export default function EmbedPulsePage() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <MarketsPage embed />
    </main>
  );
}