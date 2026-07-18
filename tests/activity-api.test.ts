import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep() };
});
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET as getActivity } from "@/app/api/activity/route";
import { GET as getMetrics } from "@/app/api/metrics/route";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const authMock = auth as unknown as Mock;

/* eslint-disable @typescript-eslint/no-explicit-any */

const storedEvents = [
  {
    id: "ev_1",
    repoId: "repo_1",
    provider: "github",
    externalId: "github:commit:abc",
    type: "commit",
    title: "fix: bug",
    summary: null,
    url: "https://github.com/acme/shiplog/commit/abc",
    additions: null,
    deletions: null,
    filesChanged: null,
    occurredAt: new Date("2026-07-10T10:00:00Z"),
    repo: { fullName: "acme/shiplog" },
  },
  {
    id: "ev_2",
    repoId: "repo_1",
    provider: "github",
    externalId: "github:pr_merged:acme/shiplog#7",
    type: "pr_merged",
    title: "Add repo selection API",
    summary: null,
    url: "https://github.com/acme/shiplog/pull/7",
    additions: 120,
    deletions: 30,
    filesChanged: 6,
    occurredAt: new Date("2026-07-09T16:00:00Z"),
    repo: { fullName: "acme/shiplog" },
  },
];

function req(base: string, params: Record<string, string>) {
  const url = new URL(`http://localhost${base}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url);
}

describe("GET /api/activity (A4)", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    authMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await getActivity(
      req("/api/activity", { start: "2026-07-01", end: "2026-07-18" })
    );
    expect(res.status).toBe(401);
  });

  it("returns range-filtered events as DTOs sorted by occurredAt", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.activityEvent.findMany.mockResolvedValue(storedEvents as any);

    const res = await getActivity(
      req("/api/activity", { start: "2026-07-01", end: "2026-07-18" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    const args = prismaMock.activityEvent.findMany.mock.calls[0][0]!;
    expect(args.where).toMatchObject({
      userId: "user_1",
      occurredAt: {
        gte: new Date("2026-07-01T00:00:00.000Z"),
        lte: new Date("2026-07-18T00:00:00.000Z"),
      },
    });
    expect(args.orderBy).toEqual({ occurredAt: "desc" });

    expect(body.events).toHaveLength(2);
    expect(body.events[0]).toMatchObject({
      id: "ev_1",
      repoFullName: "acme/shiplog",
      type: "commit",
      occurredAt: "2026-07-10T10:00:00.000Z",
    });
  });

  it("rejects an invalid range with 400", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    const res = await getActivity(
      req("/api/activity", { start: "nope", end: "2026-07-18" })
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/metrics (A4)", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    authMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await getMetrics(
      req("/api/metrics", { start: "2026-07-01", end: "2026-07-18" })
    );
    expect(res.status).toBe(401);
  });

  it("computes SPEC §12 metrics over the user's events in range", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.activityEvent.findMany.mockResolvedValue(storedEvents as any);

    const res = await getMetrics(
      req("/api/metrics", { start: "2026-07-06", end: "2026-07-12" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      commits: 1,
      prsMerged: 1,
      prsOpened: 0,
      reviewsGiven: 0,
      activeRepos: 1,
    });
  });
});
