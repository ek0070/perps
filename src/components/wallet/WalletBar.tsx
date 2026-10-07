"use client";

import { useEffect, useState } from "react";
import { fmtUsd, shortAddr } from "@/lib/format";
import { Num } from "../ui/Num";
import { DepositModal } from "./DepositModal";
import { useWallet } from "./WalletContext";

/** One fixed-height row: log in, or address + account value + deposit. */
export function WalletBar({ loginHref }: { loginHref: string }) {
  const { configured, ready, address, account, login, logout } = useWallet();
  const [framed, setFramed] = useState(false);
  const [deposit, setDeposit] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setFramed(window.self !== window.top);
    } catch {
      setFramed(true);
    }
  }, []);

  const copy = () => {
    if (!address) return;
    navigator.clipboard?.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const btn = "h-7 rounded-lg border border-white/25 px-2.5 text-xs font-semibold transition hover:border-white hover:bg-white hover:text-black";

  return (
    <div className="flex h-9 items-center justify-between gap-2 text-xs">
      {!configured ? (
        <span className="text-white/50">Wallet login is not configured.</span>
      ) : !ready ? (
        <span className="skel h-5 w-40" />
      ) : !address ? (
        <>
          <span className="truncate text-white/50">Log in to get a wallet and trade.</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {framed && (
              <a href={loginHref} target="_blank" rel="noopener" className="px-1 text-white/50 underline-offset-2 transition hover:text-white hover:underline">
                New tab
              </a>
            )}
            <button onClick={login} className={`${btn} border-white bg-white text-black hover:bg-white/85`}>
              Log in
            </button>
          </span>
        </>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-2">
            <button onClick={copy} title="Copy address" className="num text-white/60 transition hover:text-white">
              {copied ? "Copied" : shortAddr(address)}
            </button>
            <Num value={account ? fmtUsd(account.equity) : null} className="font-bold" />
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <button onClick={() => setDeposit(true)} className={btn}>
              Deposit
            </button>
            <button onClick={logout} className="px-1 text-white/40 transition hover:text-white">
              Log out
            </button>
          </span>
        </>
      )}
      {deposit && address && <DepositModal address={address} onClose={() => setDeposit(false)} />}
    </div>
  );
}
