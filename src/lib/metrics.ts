import type { ActivityEvent, MetricsSummary } from "@/lib/types";

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Compute dashboard metrics from ActivityEvents (SPEC §12). */
export function computeMetrics(
  events: ActivityEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): MetricsSummary {
  const prsOpened = events.filter((e) => e.type === "pr_opened").length;
  const prsMerged = events.filter((e) => e.type === "pr_merged").length;
  const reviews = events.filter((e) => e.type === "review").length;
  const commits = events.filter((e) => e.type === "commit").length;

  const repos = new Set(
    events
      .map((e) => e.repoFullName || e.repoId)
      .filter((v): v is string => Boolean(v)),
  );

  const additions = events.reduce((sum, e) => sum + (e.additions ?? 0), 0);
  const deletions = events.reduce((sum, e) => sum + (e.deletions ?? 0), 0);

  const activeDays = new Set(events.map((e) => dayKey(new Date(e.occurredAt))));

  let workingDays = 0;
  const cursor = new Date(rangeStart);
  cursor.setHours(12, 0, 0, 0);
  const end = new Date(rangeEnd);
  end.setHours(12, 0, 0, 0);
  while (cursor.getTime() <= end.getTime()) {
    if (isWeekday(cursor)) workingDays += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  const consistency =
    workingDays === 0 ? 0 : Math.min(1, activeDays.size / workingDays);

  let streak = 0;
  const streakCursor = new Date(rangeEnd);
  streakCursor.setHours(12, 0, 0, 0);
  while (streakCursor.getTime() >= rangeStart.getTime()) {
    if (activeDays.has(dayKey(streakCursor))) {
      streak += 1;
      streakCursor.setDate(streakCursor.getDate() - 1);
    } else if (!isWeekday(streakCursor)) {
      streakCursor.setDate(streakCursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    prsOpened,
    prsMerged,
    reviews,
    commits,
    reposActive: repos.size,
    additions,
    deletions,
    consistency,
    streak,
  };
}

export function topPullRequests(events: ActivityEvent[], limit = 5) {
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

export function resumeBullets(metrics: MetricsSummary, repoCount: number) {
  return [
    `Merged ${metrics.prsMerged} pull requests across ${repoCount || metrics.reposActive} production repositories`,
    `Completed ${metrics.reviews} code reviews for teammates`,
    `Authored ${metrics.commits} commits with ${metrics.additions.toLocaleString()} lines added`,
  ];
}
