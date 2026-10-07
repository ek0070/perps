"use client";

import Link from "next/link";
import { Wordmark } from "./Logo";
import { WalletBar } from "./wallet/WalletBar";

const LINKS = [
  { key: "trade", href: "/", label: "Trade" },
  { key: "markets", href: "/pulse", label: "Markets" },
  { key: "terms", href: "/terms", label: "Terms" },
] as const;

/** Top bar shared by the trading screen and the markets page. */
export function Nav({ active, loginHref }: { active: "trade" | "markets"; loginHref: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-panel px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                active === l.key ? "bg-accent/15 text-white" : "text-muted hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden w-[320px] md:block">
        <WalletBar loginHref={loginHref} />
      </div>
    </header>
  );
}
