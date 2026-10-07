import Link from "next/link";
import { Logo, Wordmark } from "@/components/Logo";
import { SITE_NAME } from "@/lib/site";

export const metadata = { title: "Terms" };

const SECTIONS: [string, string][] = [
  [
    "What this is",
    `${SITE_NAME} is an interface. It shows market data and helps you build and sign orders that are sent to Hyperliquid, a third-party perpetual futures exchange. We do not run the exchange, match orders, or hold funds.`,
  ],
  [
    "Your wallet",
    "Logging in creates a non-custodial embedded wallet through Privy. You control it. We cannot move your funds, reverse an order, or recover a wallet you lose access to.",
  ],
  [
    "Risk",
    "Perpetual futures are leveraged products. Losses can exceed what you expect and positions can be liquidated, losing your entire margin. Funding payments, slippage and exchange outages all affect results. Only trade with money you can afford to lose.",
  ],
  [
    "Not advice",
    "Nothing here is financial, investment, legal or tax advice. A market appearing on this site is not an endorsement.",
  ],
  [
    "Availability",
    "Leveraged derivatives are restricted or prohibited in some countries. You are responsible for knowing and following the rules where you live, including the exchange's own restrictions.",
  ],
  [
    "No warranty",
    "The service is provided as is, with no guarantee that data is accurate or that the site is available. To the extent the law allows, we are not liable for losses from using it.",
  ],
];

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-bg px-4 pb-24 sm:px-6">
      <nav className="flex h-20 items-center">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} />
          <Wordmark />
        </Link>
      </nav>
      <h1 className="mt-8 font-display text-5xl font-black uppercase">Terms</h1>
      <div className="mt-10 space-y-8">
        {SECTIONS.map(([title, body]) => (
          <section key={title}>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">{title}</h2>
            <p className="mt-2 leading-relaxed text-white/65">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
