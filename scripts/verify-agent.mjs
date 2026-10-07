// Checks the external-wallet (Phantom) path without funds: a throwaway key signs
// the one-time "approve agent" action on Ethereum mainnet's chain id, as an
// extension wallet would. The account has never deposited, so the exchange must
// refuse, and how it refuses shows whether the signature was understood.
//
//   node scripts/verify-agent.mjs
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const master = privateKeyToAccount(generatePrivateKey());
const agent = privateKeyToAccount(generatePrivateKey());
const ex = new ExchangeClient({ transport: new HttpTransport(), wallet: master, signatureChainId: "0x1" });

let reply;
try {
  reply = JSON.stringify(await ex.approveAgent({ agentAddress: agent.address, agentName: "PerpeXuals" }));
} catch (err) {
  reply = String(err?.message ?? err);
}
console.log("master :", master.address);
console.log("reply  :", reply);
const understood = /must deposit|does not exist/i.test(reply) || reply.toLowerCase().includes(master.address.toLowerCase()) || /"status":"ok"/.test(reply);
console.log(understood ? "PASS: signature accepted; refused only because the account has no deposit" : "CHECK: unexpected reply");
process.exit(understood ? 0 : 1);
