import Link from "next/link";
import { MakeLink } from "@/components/home/MakeLink";
import { Logo, Wordmark } from "@/components/Logo";
import { X_HANDLE, X_URL } from "@/lib/site";

export const metadata = { title: "About" };

const STEPS = [
  { n: "01", title: "Pick a market", body: "Type any perp ticker: BTC, ETH, SOL, HYPE and every other listed market." },
  { n: "02", title: "Post the link", body: "Share it on X. The post unfurls into a live trading terminal instead of a picture." },
  { n: "03", title: "Anyone can trade in the post", body: "Readers log in, deposit, and go long or short with leverage without leaving the timeline." },
];

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-black">
      <div aria-hidden="true">
        <div className="step-frame left-[-8%] top-24 h-[420px] w-[520px]" />
        <div className="step-frame right-[-10%] top-[620px] h-[520px] w-[640px] rotate-180" />
        <div className="step-frame bottom-40 left-[12%] h-[360px] w-[460px]" />
      </div>

      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <nav className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={32} />
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/pulse" className="hidden rounded-xl px-3 py-2 sm:block text-sm font-semibold text-white/70 transition hover:text-white">
              Pulse
            </Link>
            <Link
              href="/"
              className="whitespace-nowrap rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-white/85 sm:px-4"
            >
              Launch terminal
            </Link>
          </div>
        </nav>

        <section className="grid items-center gap-12 py-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:py-24">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-white/55">THE FIRST TERMINAL BUILT INSIDE X</p>
            <h1 className="text-glow mt-6 font-display text-[13vw] font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-[5.5rem]">
              Your timeline is your terminal
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/65 sm:text-xl">
              Long and short perps with leverage without ever leaving X.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#make" className="h-13 rounded-2xl bg-white px-6 font-semibold leading-[3.25rem] text-black transition hover:bg-white/85">
                Make a link
              </a>
              <Link
                href="/"
                className="h-13 rounded-2xl border border-white/25 px-6 font-semibold leading-[3.25rem] text-white transition hover:border-white hover:bg-white hover:text-black"
              >
                Open the terminal
              </Link>
            </div>
          </div>

          {/* A mock X post with the real player running inside it. */}
          <div className="mx-auto w-full max-w-[512px] rounded-3xl lg:w-[512px] border border-white/15 bg-black p-4 shadow-[0_0_90px_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                <Logo size={22} />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-bold">Tweet Terminal</div>
                <div className="truncate text-sm text-white/45">{X_HANDLE}</div>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-snug">Live perps. Tap a market, long or short it, right here.</p>
            <div className="mt-3 aspect-square w-full overflow-hidden rounded-2xl border border-white/15">
              <iframe src="/embed/pulse" title="Tweet Terminal live player" loading="lazy" className="h-full w-full border-0" />
            </div>
            <div className="mt-3 flex justify-between px-1 font-mono text-xs text-white/35">
              <span>Reply</span>
              <span>Repost</span>
              <span>Like</span>
              <span>Share</span>
            </div>
          </div>
        </section>

        <section id="make" className="scroll-mt-10 py-14 lg:py-20">
          <p className="font-mono text-xs tracking-[0.3em] text-white/55">MAKE A LINK</p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-none sm:text-5xl">Turn any perp into a post</h2>
          <div className="mt-8 max-w-3xl">
            <MakeLink />
          </div>
        </section>

        <section className="py-14 lg:py-20">
          <p className="font-mono text-xs tracking-[0.3em] text-white/55">HOW IT WORKS</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl border border-white/12 bg-black p-6 transition duration-300 hover:border-white/50 hover:shadow-[0_0_50px_rgba(255,255,255,0.08)] sm:p-8">
                <div className="font-mono text-sm text-white/40">{s.n}</div>
                <h3 className="mt-6 font-display text-2xl font-extrabold uppercase leading-tight">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-24 text-center lg:py-36">
          <h2 className="text-glow font-display text-[20vw] font-black uppercase leading-[0.85] tracking-tight sm:text-[9rem] lg:text-[12rem]">
            Only on X
          </h2>
          <Link href="/" className="mt-10 inline-block rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black transition hover:bg-white/85">
            Try it now
          </Link>
        </section>

        <footer className="flex flex-col items-start justify-between gap-4 border-t border-white/10 py-8 text-sm text-white/50 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo size={22} />
            <span>Not financial advice. Trading perps with leverage is risky and you can lose your entire deposit.</span>
          </div>
          <div className="flex shrink-0 gap-5">
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <a href={X_URL} target="_blank" rel="noopener" className="transition hover:text-white">
              {X_HANDLE}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
