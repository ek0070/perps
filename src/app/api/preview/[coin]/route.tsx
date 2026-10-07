import { ImageResponse } from "next/og";
import { changePct, fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import { getMarket } from "@/lib/hl";
import { SITE_NAME } from "@/lib/site";
import { PreviewLogo } from "../logo";

export const dynamic = "force-dynamic";

/** 1200x630 card image for twitter:image / og:image. */
export async function GET(_req: Request, { params }: { params: Promise<{ coin: string }> }) {
  const { coin } = await params;
  const m = await getMarket(coin).catch(() => null);
  if (!m) return new Response("unknown market", { status: 404 });
  const chg = changePct(m.mark, m.prev);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080a12",
          color: "#fff",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <PreviewLogo size={64} />
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 7 }}>{SITE_NAME.toUpperCase()}</div>
          </div>
          <div style={{ display: "flex", border: "2px solid #8b5cf6", borderRadius: 14, padding: "8px 20px", fontSize: 28 }}>
            {`UP TO ${m.maxLev}X`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#8a92b2" }}>{`${m.coin}-PERP`}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 32 }}>
            <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1.05 }}>{`$${fmtPrice(m.mark)}`}</div>
            <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 22, color: chg >= 0 ? "#16d9a4" : "#ff4d74" }}>
              {fmtPct(chg)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#8a92b2" }}>
          <div>{`24h volume ${fmtUsd(m.vol)}`}</div>
          <div>{`Open interest ${fmtUsd(m.oi)}`}</div>
          <div style={{ color: "#a78bfa" }}>Long or short inside the post</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
  );
}
