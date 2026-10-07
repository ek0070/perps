import { PLAYER_SIZE, SITE_NAME, SITE_URL, X_HANDLE } from "@/lib/site";

/**
 * The X Player Card and Open Graph tags, written by hand (React hoists <meta>
 * into <head>). Next's metadata API would add a second twitter:card of its own
 * as soon as openGraph is set, and X needs exactly one.
 */
export function PlayerCardTags({
  path,
  playerPath,
  imagePath,
  title,
  description,
}: {
  /** The share page, e.g. "/t/BTC". */
  path: string;
  /** The framed player, e.g. "/embed/BTC". */
  playerPath: string;
  imagePath: string;
  title: string;
  description: string;
}) {
  const image = `${SITE_URL}${imagePath}`;
  return (
    <>
      <meta name="twitter:card" content="player" />
      <meta name="twitter:site" content={X_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:player" content={`${SITE_URL}${playerPath}`} />
      <meta name="twitter:player:width" content={String(PLAYER_SIZE)} />
      <meta name="twitter:player:height" content={String(PLAYER_SIZE)} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={`${SITE_URL}${path}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    </>
  );
}
