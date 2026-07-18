import { describe, it, expect } from "vitest";
import { computeMetrics, type MetricsEvent } from "@/lib/metrics";

// Mon 2026-07-06 .. Fri 2026-07-10 — 5 working days, plus the weekend after.
const range = {
  start: new Date("2026-07-06T00:00:00Z"),
  end: new Date("2026-07-12T23:59:59Z"),
};

function ev(
  type: MetricsEvent["type"],
  repoId: string,
  iso: string
): MetricsEvent {
  return { type, repoId, occurredAt: new Date(iso) };
}

describe("computeMetrics (A4 — SPEC §12 definitions)", () => {
  it("returns all zeros for an empty range", () => {
    const m = computeMetrics([], range);
    expect(m).toMatchObject({
      prsOpened: 0,
      prsMerged: 0,
      reviewsGiven: 0,
      commits: 0,
      activeRepos: 0,
      consistency: 0,
    });
  });

  it("counts each metric per its SPEC §12 definition", () => {
    const events = [
      ev("commit", "r1", "2026-07-06T10:00:00Z"),
      ev("commit", "r1", "2026-07-06T11:00:00Z"),
      ev("pr_opened", "r1", "2026-07-07T09:00:00Z"),
      ev("pr_merged", "r1", "2026-07-08T15:00:00Z"),
      ev("review", "r2", "2026-07-09T10:00:00Z"),
      ev("review", "r2", "2026-07-09T11:00:00Z"),
      ev("issue_closed", "r3", "2026-07-10T12:00:00Z"),
    ];
    const m = computeMetrics(events, range);
    expect(m.commits).toBe(2);
    expect(m.prsOpened).toBe(1);
    expect(m.prsMerged).toBe(1);
    expect(m.reviewsGiven).toBe(2);
    expect(m.activeRepos).toBe(3); // distinct repos with ≥1 event
  });

  it("computes consistency as active days over working days (Mon–Fri)", () => {
    // Active on Mon, Tue, Wed = 3 of 5 working days; the weekend
    // days in range must not inflate the denominator.
    const events = [
      ev("commit", "r1", "2026-07-06T10:00:00Z"), // Mon
      ev("commit", "r1", "2026-07-07T10:00:00Z"), // Tue
      ev("pr_opened", "r1", "2026-07-08T10:00:00Z"), // Wed
      ev("commit", "r1", "2026-07-11T10:00:00Z"), // Sat — active day but not a working day
    ];
    const m = computeMetrics(events, range);
    expect(m.consistency).toBeCloseTo(3 / 5);
  });

  it("caps consistency at 1 even with weekend-only extra activity", () => {
    const events = [
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11", // Sat
      "2026-07-12", // Sun
    ].map((d) => ev("commit", "r1", `${d}T10:00:00Z`));
    const m = computeMetrics(events, range);
    expect(m.consistency).toBe(1);
  });

  it("ignores events outside the range", () => {
    const events = [
      ev("commit", "r1", "2026-07-01T10:00:00Z"), // before
      ev("commit", "r1", "2026-07-20T10:00:00Z"), // after
    ];
    const m = computeMetrics(events, range);
    expect(m.commits).toBe(0);
    expect(m.activeRepos).toBe(0);
  });

  it("echoes the range back as ISO strings for the DTO", () => {
    const m = computeMetrics([], range);
    expect(m.rangeStart).toBe(range.start.toISOString());
    expect(m.rangeEnd).toBe(range.end.toISOString());
  });
});
