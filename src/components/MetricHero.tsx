import type { MetricsDTO } from "@/lib/types";

export function MetricHero({
  metrics,
  streak,
  rangeLabel,
}: {
  metrics: MetricsDTO;
  streak: number;
  rangeLabel: string;
}) {
  const stats = [
    { label: "Streak", value: `${streak}d` },
    { label: "PRs merged", value: String(metrics.prsMerged) },
    { label: "Reviews", value: String(metrics.reviewsGiven) },
    { label: "Repos active", value: String(metrics.activeRepos) },
  ];

  return (
    <section className="panel overflow-hidden !rounded-[12px]">
      <div className="border-b border-[var(--line)] px-6 py-6 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          Contribution pulse · {rangeLabel}
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-[var(--ink-strong)] sm:text-4xl">
          Proof over vibes.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Consistency {Math.round(metrics.consistency * 100)}% of working days ·{" "}
          {metrics.commits} commits · {metrics.prsOpened} PRs opened
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--surface)] px-5 py-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl text-[var(--ink-strong)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
