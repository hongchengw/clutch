import type { StandupRangePreset } from "./types";

// Range preset resolution (A4/A5, SPEC §7.4). All math in UTC for
// deterministic behavior across environments.

export interface RangeRequest {
  preset: StandupRangePreset;
  start?: Date;
  end?: Date;
}

export interface RangeContext {
  now?: Date;
  internshipStartDate?: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function resolveRange(
  req: RangeRequest,
  ctx: RangeContext = {}
): { start: Date; end: Date } {
  const now = ctx.now ?? new Date();

  switch (req.preset) {
    case "yesterday": {
      const todayStart = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      );
      return {
        start: new Date(todayStart - DAY_MS),
        end: new Date(todayStart - 1),
      };
    }
    case "last7":
      return { start: new Date(now.getTime() - 7 * DAY_MS), end: now };
    case "last30":
      return { start: new Date(now.getTime() - 30 * DAY_MS), end: now };
    case "internship": {
      if (!ctx.internshipStartDate) {
        throw new Error(
          "No internship start date set — add one in settings first"
        );
      }
      return { start: ctx.internshipStartDate, end: now };
    }
    case "custom": {
      if (!req.start || !req.end) {
        throw new Error("Custom range requires both start and end");
      }
      if (req.start.getTime() > req.end.getTime()) {
        throw new Error("Custom range start must be before end");
      }
      return { start: req.start, end: req.end };
    }
  }
}
