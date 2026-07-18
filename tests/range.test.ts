import { describe, it, expect } from "vitest";
import { resolveRange } from "@/lib/range";

const now = new Date("2026-07-18T15:30:00Z"); // a Saturday

describe("resolveRange (A4/A5 — SPEC §7.4 range presets)", () => {
  it("yesterday = the full previous UTC day", () => {
    const r = resolveRange({ preset: "yesterday" }, { now });
    expect(r.start.toISOString()).toBe("2026-07-17T00:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-07-17T23:59:59.999Z");
  });

  it("last7 = trailing 7 days ending now", () => {
    const r = resolveRange({ preset: "last7" }, { now });
    expect(r.end).toEqual(now);
    expect(r.start.toISOString()).toBe("2026-07-11T15:30:00.000Z");
  });

  it("last30 = trailing 30 days ending now", () => {
    const r = resolveRange({ preset: "last30" }, { now });
    expect(r.start.toISOString()).toBe("2026-06-18T15:30:00.000Z");
  });

  it("internship = start date → now", () => {
    const r = resolveRange(
      { preset: "internship" },
      { now, internshipStartDate: new Date("2026-06-01T00:00:00Z") }
    );
    expect(r.start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(r.end).toEqual(now);
  });

  it("internship without a start date throws a clear error", () => {
    expect(() => resolveRange({ preset: "internship" }, { now })).toThrow(
      /internship start date/i
    );
  });

  it("custom uses the provided bounds", () => {
    const r = resolveRange(
      {
        preset: "custom",
        start: new Date("2026-07-01T00:00:00Z"),
        end: new Date("2026-07-15T00:00:00Z"),
      },
      { now }
    );
    expect(r.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-07-15T00:00:00.000Z");
  });

  it("custom requires both bounds and start <= end", () => {
    expect(() => resolveRange({ preset: "custom" }, { now })).toThrow();
    expect(() =>
      resolveRange(
        {
          preset: "custom",
          start: new Date("2026-07-15T00:00:00Z"),
          end: new Date("2026-07-01T00:00:00Z"),
        },
        { now }
      )
    ).toThrow();
  });
});
