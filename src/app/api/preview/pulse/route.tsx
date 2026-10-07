import { ImageResponse } from "next/og";
import { changePct, fmtPct, fmtPrice } from "@/lib/format";
import { getMarkets } from "@/lib/hl";
import { SITE_NAME } from "@/lib/site";
import { PreviewLogo } from "../logo";

export const dynamic = "force-dynamic";

export async function GET() {
  const markets = await getMarkets().catch(() => []);
  const top = [...markets].sort((a, b) => b.vol - a.vol).slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#080a12",
          color: "#fff",
          padding: 56,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <PreviewLogo size={60} />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 7 }}>{SITE_NAME.toUpperCase()}</div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 28, color: "#8a92b2" }}>LIVE PERPS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, gap: 14 }}>
          {top.map((m) => {
            const chg = changePct(m.mark, m.prev);
            return (
              <div
                key={m.coin}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "2px solid #232842", background: "#0f1220",
                  borderRadius: 18,
                  padding: "14px 28px",
                  fontSize: 40,
                }}
              >
                <div style={{ display: "flex", fontWeight: 800 }}>{m.coin}</div>
                <div style={{ display: "flex", gap: 40 }}>
                  <div>{`$${fmtPrice(m.mark)}`}</div>
                  <div style={{ display: "flex", width: 210, justifyContent: "flex-end", color: chg >= 0 ? "#16d9a4" : "#ff4d74" }}>
                    {fmtPct(chg)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
  );
}
