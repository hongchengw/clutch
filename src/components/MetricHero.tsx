import type { MetricsSummary } from "@/lib/types";

export function MetricHero({
  metrics,
  rangeLabel,
}: {
  metrics: MetricsSummary;
  rangeLabel: string;
}) {
  const stats = [
    { label: "Streak", value: `${metrics.streak}d` },
    { label: "PRs merged", value: String(metrics.prsMerged) },
    { label: "Reviews", value: String(metrics.reviews) },
    { label: "Repos active", value: String(metrics.reposActive) },
  ];

  return (
    <section className="panel overflow-hidden rounded-3xl">
      <div className="border-b border-[var(--line)] px-6 py-5 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--signal)]">
          Contribution pulse · {rangeLabel}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Proof over vibes.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--mist)]">
          Consistency {Math.round(metrics.consistency * 100)}% of working days ·{" "}
          {metrics.commits} commits · {metrics.prsOpened} PRs opened
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[rgba(12,18,32,0.95)] px-5 py-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--mist)]">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-[var(--paper)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
