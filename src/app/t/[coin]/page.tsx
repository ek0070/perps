import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerCardTags } from "@/components/PlayerCardTags";
import { Terminal } from "@/components/Terminal";
import { changePct, fmtPct, fmtPrice } from "@/lib/format";
import { getMarket } from "@/lib/hl";

type Props = { params: Promise<{ coin: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coin } = await params;
  const m = await getMarket(coin).catch(() => null);
  return { title: m ? `${m.coin}-PERP $${fmtPrice(m.mark)}` : "Not found" };
}

/** The shareable link: player-card tags for X, the full terminal for everyone else. */
export default async function SharePage({ params }: Props) {
  const { coin } = await params;
  const market = await getMarket(coin).catch(() => null);
  if (!market) notFound();

  const slug = encodeURIComponent(market.coin);
  const chg = fmtPct(changePct(market.mark, market.prev));
  return (
    <>
      <PlayerCardTags
        path={`/t/${slug}`}
        playerPath={`/embed/${slug}`}
        imagePath={`/api/preview/${slug}`}
        title={`${market.coin}-PERP $${fmtPrice(market.mark)} (${chg})`}
        description={`Long or short ${market.coin} with up to ${market.maxLev}x leverage, right inside this post.`}
      />
      <Terminal initial={market} />
    </>
  );
}
