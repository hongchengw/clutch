"use client";

import { useMemo, useState } from "react";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { CoachingCards } from "@/components/CoachingCards";
import { MetricHero } from "@/components/MetricHero";
import { ResumeMetrics } from "@/components/ResumeMetrics";
import { StandupGenerator } from "@/components/StandupGenerator";
import { buildCoachingCards } from "@/lib/coaching";
import {
  computeStreak,
  filterEventsByRange,
  metricsFromEvents,
  resumeBullets,
  resolveUiRange,
  topPullRequests,
} from "@/lib/ui-helpers";
import type { ActivityEventDTO, StandupRangePreset } from "@/lib/types";

const RANGE_OPTIONS: { key: StandupRangePreset; label: string }[] = [
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "internship", label: "Full internship" },
];

export function DashboardView({
  events,
  internshipStart,
  demo = false,
}: {
  events: ActivityEventDTO[];
  internshipStart?: string;
  demo?: boolean;
}) {
  const [rangeKey, setRangeKey] = useState<StandupRangePreset>("last30");

  const range = useMemo(
    () => resolveUiRange(rangeKey, { internshipStart }),
    [rangeKey, internshipStart],
  );

  const ranged = useMemo(
    () => filterEventsByRange(events, range.start, range.end),
    [events, range.start, range.end],
  );

  const metrics = useMemo(
    () => metricsFromEvents(ranged, range.start, range.end),
    [ranged, range.start, range.end],
  );

  const streak = useMemo(
    () => computeStreak(ranged, range.start, range.end),
    [ranged, range.start, range.end],
  );

  const topPrs = useMemo(() => topPullRequests(ranged, 5), [ranged]);
  const coaching = useMemo(
    () => buildCoachingCards(ranged, metrics),
    [ranged, metrics],
  );
  const bullets = useMemo(() => resumeBullets(metrics), [metrics]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--mist)]">
          {demo ? "Maya Chen · demo intern" : "Your contribution dashboard"}
        </p>
        <select
          className="field w-auto min-w-[160px]"
          value={rangeKey}
          onChange={(e) => setRangeKey(e.target.value as StandupRangePreset)}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <MetricHero
        metrics={metrics}
        streak={streak}
        rangeLabel={range.label}
      />

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Coaching</h2>
        <CoachingCards cards={coaching} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Activity</h2>
          <ActivityTimeline events={ranged} />
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Top PRs</h2>
          <ul className="panel divide-y divide-[var(--line)] rounded-2xl">
            {topPrs.length === 0 && (
              <li className="px-5 py-4 text-sm text-[var(--mist)]">
                No PRs in range.
              </li>
            )}
            {topPrs.map((pr) => (
              <li key={pr.id} className="px-5 py-4">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:text-[var(--signal)]"
                >
                  {pr.title}
                </a>
                <p className="mt-1 font-mono text-xs text-[var(--mist)]">
                  +{pr.additions ?? 0} / -{pr.deletions ?? 0} ·{" "}
                  {pr.filesChanged ?? 0} files
                </p>
              </li>
            ))}
          </ul>
          <ResumeMetrics bullets={bullets} />
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Standup generator</h2>
        <StandupGenerator
          events={events}
          internshipStart={internshipStart}
          demo={demo}
        />
      </section>
    </div>
  );
}
