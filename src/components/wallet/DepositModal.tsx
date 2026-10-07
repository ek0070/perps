"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { arbitrum } from "viem/chains";
import { Num } from "../ui/Num";
import { useWallet } from "./WalletContext";

const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const; // native USDC on Arbitrum
const BRIDGE = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7" as const; // Hyperliquid bridge
const MIN_DEPOSIT = BigInt(5_000_000); // the bridge does not credit deposits under 5 USDC

const arb = createPublicClient({
  chain: arbitrum,
  transport: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL?.trim() || undefined),
});

type MoveState = { state: "idle" | "pending" | "ok" | "error"; msg?: string; hash?: string };

export function DepositModal({ address, onClose }: { address: `0x${string}`; onClose: () => void }) {
  const { getWalletClient, refresh } = useWallet();
  const [qr, setQr] = useState<string | null>(null);
  const [usdc, setUsdc] = useState<bigint | null>(null);
  const [eth, setEth] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);
  const [move, setMove] = useState<MoveState>({ state: "idle" });

  useEffect(() => {
    QRCode.toDataURL(address, { margin: 1, width: 240, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => {});
  }, [address]);

  const load = useCallback(() => {
    arb.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [address] }).then(setUsdc).catch(() => {});
    arb.getBalance({ address }).then(setEth).catch(() => {});
  }, [address]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const copy = () =>
    navigator.clipboard?.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });

  const canMove = usdc !== null && usdc >= MIN_DEPOSIT && move.state !== "pending";

  const moveToHyperliquid = async () => {
    if (!canMove || usdc === null) return;
    setMove({ state: "pending", msg: "Sending to Hyperliquid…" });
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [BRIDGE, usdc],
        chain: arbitrum,
        account: address,
      });
      setMove({ state: "ok", msg: "Sent. It is credited in about a minute.", hash });
      load();
      setTimeout(refresh, 20_000);
      setTimeout(refresh, 60_000);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setMove({
        state: "error",
        msg: /insufficient funds|gas/i.test(raw) ? "Not enough ETH on Arbitrum to pay for gas." : raw.slice(0, 120),
      });
    }
  };

  const btn = "h-9 rounded-xl border border-white/25 px-3 text-xs font-semibold transition hover:border-white hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3" onClick={onClose}>
      <div
        className="scroll-y max-h-full w-full max-w-[440px] rounded-2xl border border-white/15 bg-black p-4 text-left shadow-[0_0_60px_rgba(255,255,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.18em]">Deposit USDC</h2>
          <button onClick={onClose} className="text-xs text-white/50 transition hover:text-white">
            Close
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-white/10">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Wallet address QR code" width={104} height={104} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-white/45">Your wallet (Arbitrum)</div>
            <div className="num mt-1 text-[11px] leading-snug text-white/85" style={{ whiteSpace: "normal", wordBreak: "break-all" }}>
              {address}
            </div>
            <button onClick={copy} className={`${btn} mt-2 h-7`}>
              {copied ? "Copied" : "Copy address"}
            </button>
          </div>
        </div>

        <ol className="mt-3 space-y-1.5 text-xs leading-snug text-white/65">
          <li>
            <span className="text-white">1.</span> Send <span className="text-white">USDC on Arbitrum</span> to this address, plus a
            little ETH on Arbitrum for gas.
          </li>
          <li>
            <span className="text-white">2.</span> Move it to your trading account. Minimum 5 USDC; smaller deposits are lost.
          </li>
        </ol>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-xs">
          <span className="text-white/50">In wallet</span>
          <span className="flex gap-3">
            <span>
              <Num value={usdc === null ? null : Number(formatUnits(usdc, 6)).toFixed(2)} /> <span className="text-white/45">USDC</span>
            </span>
            <span>
              <Num value={eth === null ? null : Number(formatUnits(eth, 18)).toFixed(5)} /> <span className="text-white/45">ETH</span>
            </span>
          </span>
        </div>

        <button onClick={moveToHyperliquid} disabled={!canMove} className={`${btn} mt-2 w-full border-white bg-white text-black hover:bg-white/85`}>
          {move.state === "pending" ? "Sending…" : "Move USDC to trading account"}
        </button>

        <div className="mt-2 min-h-4 text-[11px] leading-snug text-white/60">
          {move.msg}
          {move.hash && (
            <>
              {" "}
              <a href={`https://arbiscan.io/tx/${move.hash}`} target="_blank" rel="noopener" className="text-white underline underline-offset-2">
                Arbiscan
              </a>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] leading-snug text-white/40">
          Already on Hyperliquid? Send USDC to this address from your Hyperliquid account. It arrives instantly and needs no gas.
        </p>
      </div>
    </div>
  );
}
