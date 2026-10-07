import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerCard } from "@/components/PlayerCard";
import { getMarket } from "@/lib/hl";

type Props = { params: Promise<{ coin: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coin } = await params;
  const m = await getMarket(coin).catch(() => null);
  return { title: m ? `${m.coin}-PERP` : "Not found", robots: { index: false } };
}

export default async function EmbedPage({ params }: Props) {
  const { coin } = await params;
  const market = await getMarket(coin).catch(() => null);
  if (!market) notFound();
  return <PlayerCard initial={market} />;
}
