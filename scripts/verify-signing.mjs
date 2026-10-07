// Checks the order path without spending anything: signs a real order with a
// throwaway key, exactly as the app does, and sends it to Hyperliquid. The
// account has no funds, so the exchange must reject it, and the rejection names
// the address it recovered from the signature. If that address is ours, the
// asset id, price/size formatting and signature are all accepted as valid.
//
//   node scripts/verify-signing.mjs [COIN]
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const coin = process.argv[2] || "BTC";
const res = await fetch("https://api.hyperliquid.xyz/info", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ type: "metaAndAssetCtxs" }),
});
const [meta, ctxs] = await res.json();
const idx = meta.universe.findIndex((u) => u.name === coin);
if (idx < 0) throw new Error(`unknown coin ${coin}`);
const { szDecimals } = meta.universe[idx];
const mark = Number(ctxs[idx].markPx);

const wallet = privateKeyToAccount(generatePrivateKey());
const ex = new ExchangeClient({ transport: new HttpTransport(), wallet });
const order = { a: idx, b: true, p: formatPrice(mark * 1.01, szDecimals), s: formatSize(50 / mark, szDecimals), r: false, t: { limit: { tif: "Ioc" } } };
console.log("signer :", wallet.address);
console.log("order  :", JSON.stringify(order));

let reply;
try {
  reply = JSON.stringify(await ex.order({ orders: [order], grouping: "na" }));
} catch (err) {
  reply = String(err?.message ?? err);
}
console.log("reply  :", reply);
const recovered = reply.toLowerCase().includes(wallet.address.toLowerCase());
console.log(recovered ? "PASS: exchange recovered our address from the signature" : "CHECK: reply does not name our address");
process.exit(recovered ? 0 : 1);
