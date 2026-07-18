import type { DateRangeKey } from "@/lib/types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolveDateRange(
  key: DateRangeKey,
  opts?: {
    now?: Date;
    customStart?: string;
    customEnd?: string;
    internshipStart?: string;
    internshipEnd?: string;
  },
): { start: Date; end: Date; label: string } {
  const now = opts?.now ?? new Date();
  const end = endOfDay(now);

  switch (key) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return {
        start: startOfDay(y),
        end: endOfDay(y),
        label: "Yesterday",
      };
    }
    case "last7": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end, label: "Last 7 days" };
    }
    case "last30": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end, label: "Last 30 days" };
    }
    case "custom": {
      const start = opts?.customStart
        ? startOfDay(new Date(opts.customStart))
        : startOfDay(now);
      const customEnd = opts?.customEnd
        ? endOfDay(new Date(opts.customEnd))
        : end;
      return { start, end: customEnd, label: "Custom range" };
    }
    case "internship": {
      const start = opts?.internshipStart
        ? startOfDay(new Date(opts.internshipStart))
        : startOfDay(now);
      const internEnd = opts?.internshipEnd
        ? endOfDay(new Date(opts.internshipEnd))
        : end;
      return {
        start,
        end: internEnd.getTime() < end.getTime() ? internEnd : end,
        label: "Full internship",
      };
    }
    default:
      return { start: startOfDay(now), end, label: "Today" };
  }
}

export function filterEventsByRange<T extends { occurredAt: string }>(
  events: T[],
  start: Date,
  end: Date,
): T[] {
  const s = start.getTime();
  const e = end.getTime();
  return events.filter((event) => {
    const t = new Date(event.occurredAt).getTime();
    return t >= s && t <= e;
  });
}
