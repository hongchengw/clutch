import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <p className="font-display text-2xl font-semibold text-[var(--ink-strong)]">
          Clutch
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

      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-5xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="anim-rise tag tag-blue">For interns who ship</p>
          <h1 className="anim-rise-delay mt-5 font-display text-6xl font-medium text-[var(--ink-strong)] sm:text-7xl">
            Clutch
          </h1>
          <p className="anim-rise-delay mt-5 max-w-xl text-xl text-[var(--ink)] sm:text-2xl">
            Your commits already tell the story. We write the review.
          </p>
          <p className="anim-rise-delay-2 mt-4 max-w-lg text-base text-[var(--muted)]">
            Auto standup notes, contribution proof, and a share link your manager
            can open — consistency and reviews included.
          </p>
          <div className="anim-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">
              Connect GitHub
            </Link>
            <Link href="/demo" className="btn-ghost">
              Try demo
            </Link>
          </div>
        </div>

        <div className="anim-rise-delay os-chrome hidden lg:block">
          <div className="os-chrome__bar">
            <span className="os-chrome__dot" />
            <span className="os-chrome__dot" />
            <span className="os-chrome__dot" />
            <span className="ml-3 font-mono text-xs text-[var(--muted)]">
              clutch.app / summer brief
            </span>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Consistency", value: "72%" },
                { label: "Reviews", value: "3" },
                { label: "PRs merged", value: "5" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[8px] border border-[var(--line)] p-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-2xl text-[var(--ink-strong)]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-[8px] border border-[var(--line)] bg-[#f9f9f8] p-4">
              <p className="tag tag-green">Manager view</p>
              <p className="mt-3 text-sm text-[var(--ink)]">
                Maya Chen · summer internship
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Share one link. They see receipts, not vibes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-24 sm:px-6 md:grid-cols-3">
          {[
            {
              title: "Standups without scramble",
              body: "Yesterday, week, month, or whole internship — grounded in real PRs and commits.",
            },
            {
              title: "Invite your manager",
              body: "Send a share link. They see consistency, reviews, and proof links — no GitHub login required.",
            },
            {
              title: "Resume metrics on tap",
              body: "Copy bullets that quantify what you shipped. Editable and honest.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="anim-rise"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <h2 className="font-display text-2xl font-medium text-[var(--ink-strong)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
