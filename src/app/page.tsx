import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ship-grid opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(46,230,166,0.16),transparent_55%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <p className="font-display text-xl font-bold tracking-tight">
          Ship<span className="text-[var(--signal)]">Log</span>
        </p>
        <div className="flex items-center gap-2">
          <Link href="/demo" className="btn-ghost !py-2 !text-sm">
            Try demo
          </Link>
          <Link href="/login" className="btn-primary !py-2 !text-sm">
            Connect GitHub
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="anim-rise font-mono text-xs uppercase tracking-[0.22em] text-[var(--signal)]">
            For interns who ship
          </p>
          <h1 className="anim-rise-delay mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-[var(--paper)] sm:text-6xl md:text-7xl">
            ShipLog
          </h1>
          <p className="anim-rise-delay mt-5 max-w-xl text-xl font-medium text-[var(--fog)] sm:text-2xl">
            Your commits already tell the story. We write the review.
          </p>
          <p className="anim-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-[var(--mist)]">
            Auto standup docs, manager-ready contribution proof, and resume
            metrics from GitHub — so return-offer season is receipts, not vibes.
          </p>
          <div className="anim-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary anim-glow">
              Connect GitHub
            </Link>
            <Link href="/demo" className="btn-ghost">
              Try demo
            </Link>
          </div>
        </div>

        <div className="anim-rise-delay relative hidden min-h-[420px] lg:block">
          <div className="absolute inset-0 rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(160deg,rgba(21,34,56,0.9),rgba(8,12,20,0.95))] shadow-[0_40px_120px_rgba(0,0,0,0.45)]" />
          <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="absolute -left-10 top-10 h-56 w-[140%] rotate-[-8deg] bg-[linear-gradient(90deg,transparent,rgba(46,230,166,0.08),transparent)]" />
            <pre className="absolute inset-6 overflow-hidden font-mono text-[12px] leading-6 text-[var(--mist)]">
{`# summer '26 · maya-builds
prs_merged: 5
reviews: 3
repos: checkout-service, storefront-web

## yesterday
- Landed Surface shipping ETA from checkout API
  proof: pull/110
- Pushed Tighten ETA caching headers
  proof: commit/c3d4e5f

return_offer_radar: climbing ▓▓▓▓▓░░░`}
            </pre>
          </div>
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[rgba(46,230,166,0.35)] bg-[rgba(6,16,14,0.85)] p-4 backdrop-blur">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">
              90-second demo path
            </p>
            <p className="mt-1 text-sm text-[var(--fog)]">
              Demo mode → generate summer standup → show proof links → smile at
              the radar.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-[var(--line)] bg-[rgba(8,12,20,0.65)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            {
              title: "Standups without scramble",
              body: "Yesterday, week, month, or whole internship — grounded in real PRs and commits.",
            },
            {
              title: "Managers get receipts",
              body: "Every bullet links back to GitHub. No invented work. No memory games.",
            },
            {
              title: "Resume metrics on tap",
              body: "Copy bullets that quantify what you shipped — editable, honest, review-ready.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-xl font-semibold text-[var(--paper)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mist)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
