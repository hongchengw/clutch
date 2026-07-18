import type { ActivityEventType, MetricsDTO } from "./types";

// Metrics math (A4) — pure so it's trivially unit-testable.
// Definitions follow SPEC §12 exactly.

export interface MetricsEvent {
  type: ActivityEventType;
  repoId: string;
  occurredAt: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWorkingDay(d: Date): boolean {
  const day = d.getUTCDay();
  return day !== 0 && day !== 6;
}

/** Working days (Mon–Fri, UTC) between start and end, inclusive. */
export function countWorkingDays(range: DateRange): number {
  let count = 0;
  const cursor = new Date(
    Date.UTC(
      range.start.getUTCFullYear(),
      range.start.getUTCMonth(),
      range.start.getUTCDate()
    )
  );
  while (cursor.getTime() <= range.end.getTime()) {
    if (isWorkingDay(cursor)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export function computeMetrics(
  events: MetricsEvent[],
  range: DateRange
): MetricsDTO {
  const inRange = events.filter(
    (e) => e.occurredAt >= range.start && e.occurredAt <= range.end
  );

  const count = (type: ActivityEventType) =>
    inRange.filter((e) => e.type === type).length;

  // Numerator counts active working days only, so weekend pushes never
  // skew consistency in either direction.
  const activeDays = new Set(
    inRange.filter((e) => isWorkingDay(e.occurredAt)).map((e) => utcDayKey(e.occurredAt))
  );
  const workingDays = countWorkingDays(range);
  const consistency =
    workingDays === 0 ? 0 : Math.min(1, activeDays.size / workingDays);

  return {
    rangeStart: range.start.toISOString(),
    rangeEnd: range.end.toISOString(),
    prsOpened: count("pr_opened"),
    prsMerged: count("pr_merged"),
    reviewsGiven: count("review"),
    commits: count("commit"),
    activeRepos: new Set(inRange.map((e) => e.repoId)).size,
    consistency,
  };
}
