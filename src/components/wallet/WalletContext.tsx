"use client";

import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createWalletClient, custom, type WalletClient } from "viem";
import { arbitrum } from "viem/chains";
import { PRIVY_APP_ID } from "@/lib/site";

export type Position = {
  coin: string;
  /** Signed size as the exchange reports it: positive long, negative short. */
  szi: string;
  size: number;
  entryPx: number;
  value: number;
  pnl: number;
  /** Return on margin, percent. */
  roe: number;
  leverage: number;
  liqPx: number | null;
};

export type OpenOrder = { coin: string; oid: number; isBuy: boolean; px: number; sz: number; reduceOnly: boolean; time: number };

export type Account = { equity: number; withdrawable: number; marginUsed: number; positions: Position[]; orders: OpenOrder[] };

type Ctx = {
  /** False when NEXT_PUBLIC_PRIVY_APP_ID is missing. */
  configured: boolean;
  ready: boolean;
  address: `0x${string}` | null;
  /** null while loading. */
  account: Account | null;
  login: () => void;
  logout: () => void;
  refresh: () => void;
  getWalletClient: () => Promise<WalletClient>;
  getExchange: () => Promise<ExchangeClient>;
};

const notConfigured = async () => {
  throw new Error("Wallets are not configured on this site.");
};

const WalletCtx = createContext<Ctx>({
  configured: false,
  ready: true,
  address: null,
  account: null,
  login: () => {},
  logout: () => {},
  refresh: () => {},
  getWalletClient: notConfigured,
  getExchange: notConfigured,
});

export const useWallet = () => useContext(WalletCtx);

type RawState = {
  marginSummary: { accountValue: string; totalMarginUsed: string };
  withdrawable: string;
  assetPositions: {
    position: {
      coin: string;
      szi: string;
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      liquidationPx: string | null;
      leverage: { value: number };
    };
  }[];
};

// Account state is read straight from Hyperliquid by the browser (CORS is open),
// so per-user polling counts against the user's own rate limit, not the server's.
type RawOrder = { coin: string; side: "B" | "A"; limitPx: string; sz: string; oid: number; timestamp: number; reduceOnly?: boolean };

async function hlInfo<T>(body: unknown): Promise<T> {
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`account ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchAccount(user: string): Promise<Account> {
  const [raw, rawOrders] = await Promise.all([
    hlInfo<RawState>({ type: "clearinghouseState", user }),
    hlInfo<RawOrder[]>({ type: "frontendOpenOrders", user }).catch(() => [] as RawOrder[]),
  ]);
  return {
    equity: Number(raw.marginSummary.accountValue) || 0,
    withdrawable: Number(raw.withdrawable) || 0,
    marginUsed: Number(raw.marginSummary.totalMarginUsed) || 0,
    orders: rawOrders.map((o) => ({
      coin: o.coin,
      oid: o.oid,
      isBuy: o.side === "B",
      px: Number(o.limitPx),
      sz: Number(o.sz),
      reduceOnly: !!o.reduceOnly,
      time: o.timestamp,
    })),
    positions: raw.assetPositions
      .map(({ position: p }) => ({
        coin: p.coin,
        szi: p.szi,
        size: Number(p.szi),
        entryPx: Number(p.entryPx),
        value: Number(p.positionValue),
        pnl: Number(p.unrealizedPnl),
        roe: Number(p.returnOnEquity) * 100,
        leverage: p.leverage.value,
        liqPx: p.liquidationPx ? Number(p.liquidationPx) : null,
      }))
      .filter((p) => p.size !== 0),
  };
}

const AUTH_CHANNEL = "tt-auth";

function PrivyBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = useMemo(() => wallets.find((w) => w.walletClientType === "privy") ?? null, [wallets]);
  const address = authenticated && wallet ? (wallet.address as `0x${string}`) : null;

  const [account, setAccount] = useState<Account | null>(null);
  const refresh = useCallback(() => {
    if (!address) return;
    fetchAccount(address)
      .then(setAccount)
      .catch(() => {});
  }, [address]);

  useEffect(() => {
    setAccount(null);
    if (!address) return;
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [address, refresh]);

  // Login handoff. When the X iframe blocks a login popup, the player opens
  // /t/<coin>?login=1 in a new tab; that tab logs in and tells the player to reload.
  const wasAuthed = useRef<boolean | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (typeof BroadcastChannel !== "undefined") {
      if (wasAuthed.current === false && authenticated) {
        const ch = new BroadcastChannel(AUTH_CHANNEL);
        ch.postMessage("login");
        ch.close();
      }
    }
    if (wasAuthed.current === null && !authenticated && new URLSearchParams(window.location.search).has("login")) {
      login();
    }
    wasAuthed.current = authenticated;
  }, [ready, authenticated, login]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    ch.onmessage = () => {
      if (wasAuthed.current === false) window.location.reload();
    };
    return () => ch.close();
  }, []);

  const getWalletClient = useCallback(async () => {
    if (!wallet) throw new Error("Log in first.");
    await wallet.switchChain(arbitrum.id);
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({ account: wallet.address as `0x${string}`, chain: arbitrum, transport: custom(provider) });
  }, [wallet]);

  const getExchange = useCallback(async () => {
    const client = await getWalletClient();
    return new ExchangeClient({ transport: new HttpTransport(), wallet: client });
  }, [getWalletClient]);

  const value = useMemo<Ctx>(
    () => ({ configured: true, ready, address, account, login, logout, refresh, getWalletClient, getExchange }),
    [ready, address, account, login, logout, refresh, getWalletClient, getExchange],
  );
  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) return <>{children}</>;
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "twitter"],
        appearance: { theme: "dark", accentColor: "#8b5cf6" },
        defaultChain: arbitrum,
        supportedChains: [arbitrum],
        // Non-custodial wallet created on first login; signing happens without a
        // confirmation modal so an order is one tap inside the post.
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" }, showWalletUIs: false },
      }}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  );
}
