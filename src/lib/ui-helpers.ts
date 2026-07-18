import { computeMetrics } from "@/lib/metrics";
import { resolveRange } from "@/lib/range";
import type {
  ActivityEventDTO,
  MetricsDTO,
  StandupRangePreset,
} from "@/lib/types";

export function filterEventsByRange(
  events: ActivityEventDTO[],
  start: Date,
  end: Date,
): ActivityEventDTO[] {
  const s = start.getTime();
  const e = end.getTime();
  return events
    .filter((event) => {
      const t = new Date(event.occurredAt).getTime();
      return t >= s && t <= e;
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

export function resolveUiRange(
  preset: StandupRangePreset,
  opts?: {
    customStart?: string;
    customEnd?: string;
    internshipStart?: string;
  },
): { start: Date; end: Date; label: string } {
  const labels: Record<StandupRangePreset, string> = {
    yesterday: "Yesterday",
    last7: "Last 7 days",
    last30: "Last 30 days",
    custom: "Custom range",
    internship: "Full internship",
  };

  const range = resolveRange(
    {
      preset,
      start: opts?.customStart ? new Date(opts.customStart) : undefined,
      end: opts?.customEnd ? new Date(opts.customEnd) : undefined,
    },
    {
      internshipStartDate: opts?.internshipStart
        ? new Date(opts.internshipStart)
        : new Date("2026-05-26T00:00:00.000Z"),
    },
  );

  return { ...range, label: labels[preset] };
}

export function metricsFromEvents(
  events: ActivityEventDTO[],
  start: Date,
  end: Date,
): MetricsDTO {
  return computeMetrics(
    events.map((e) => ({
      type: e.type,
      repoId: e.repoId,
      occurredAt: new Date(e.occurredAt),
    })),
    { start, end },
  );
}

export function computeStreak(
  events: ActivityEventDTO[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const activeDays = new Set(
    events.map((e) => new Date(e.occurredAt).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date(rangeEnd);
  cursor.setUTCHours(12, 0, 0, 0);
  while (cursor.getTime() >= rangeStart.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    const day = cursor.getUTCDay();
    if (activeDays.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (day === 0 || day === 6) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function topPullRequests(events: ActivityEventDTO[], limit = 5) {
  return events
    .filter((e) => e.type === "pr_merged" || e.type === "pr_opened")
    .map((e) => ({
      event: e,
      impact:
        (e.additions ?? 0) + (e.deletions ?? 0) + (e.filesChanged ?? 0) * 10,
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, limit)
    .map((x) => x.event);
}

export function resumeBullets(metrics: MetricsDTO) {
  return [
    `Merged ${metrics.prsMerged} pull requests across ${metrics.activeRepos} production repositories`,
    `Completed ${metrics.reviewsGiven} code reviews for teammates`,
    `Authored ${metrics.commits} commits in the selected range`,
  ];
}
