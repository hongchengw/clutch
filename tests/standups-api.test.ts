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
import { POST as generate } from "@/app/api/standups/generate/route";
import { GET as listStandups } from "@/app/api/standups/route";
import {
  GET as getStandup,
  PATCH as patchStandup,
} from "@/app/api/standups/[id]/route";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const authMock = auth as unknown as Mock;

/* eslint-disable @typescript-eslint/no-explicit-any */

const storedEvent = {
  id: "ev_merged",
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
  occurredAt: new Date("2026-07-17T16:00:00Z"),
  repo: { fullName: "acme/shiplog" },
};

const storedDoc = {
  id: "doc_1",
  userId: "user_1",
  rangeStart: new Date("2026-07-17T00:00:00Z"),
  rangeEnd: new Date("2026-07-17T23:59:59.999Z"),
  tone: "casual",
  length: "standard",
  contentMd: "## What I did",
  contentJson: { didYesterday: [], doingNext: [], blockers: [], proofLinks: [] },
  eventIds: ["ev_merged"],
  createdAt: new Date("2026-07-18T08:00:00Z"),
  updatedAt: new Date("2026-07-18T08:00:00Z"),
};

function jsonReq(url: string, method: string, body?: unknown) {
  return new Request(`http://localhost${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
});

describe("POST /api/standups/generate (A5)", () => {
  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await generate(
      jsonReq("/api/standups/generate", "POST", { preset: "yesterday" })
    );
    expect(res.status).toBe(401);
  });

  it("generates from range events and persists cited eventIds", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.user.findUnique.mockResolvedValue({
      internshipStartDate: new Date("2026-06-01T00:00:00Z"),
    } as any);
    prismaMock.activityEvent.findMany.mockResolvedValue([storedEvent] as any);
    prismaMock.standupDoc.create.mockResolvedValue(storedDoc as any);

    const res = await generate(
      jsonReq("/api/standups/generate", "POST", {
        preset: "yesterday",
        tone: "casual",
        length: "standard",
      })
    );
    expect(res.status).toBe(200);

    const createArgs = prismaMock.standupDoc.create.mock.calls[0][0];
    expect(createArgs.data).toMatchObject({
      userId: "user_1",
      tone: "casual",
      length: "standard",
      eventIds: ["ev_merged"],
    });
    expect(createArgs.data.contentMd).toContain(
      "https://github.com/acme/shiplog/pull/7"
    );

    const body = await res.json();
    expect(body.id).toBe("doc_1");
    expect(body.eventIds).toEqual(["ev_merged"]);
  });

  it("400s when internship preset has no start date", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.user.findUnique.mockResolvedValue({
      internshipStartDate: null,
    } as any);

    const res = await generate(
      jsonReq("/api/standups/generate", "POST", { preset: "internship" })
    );
    expect(res.status).toBe(400);
    expect(prismaMock.standupDoc.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/standups + /api/standups/:id (A5)", () => {
  it("lists only the current user's standups, newest first", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.standupDoc.findMany.mockResolvedValue([storedDoc] as any);

    const res = await listStandups();
    expect(res.status).toBe(200);
    const args = prismaMock.standupDoc.findMany.mock.calls[0][0]!;
    expect(args.where).toEqual({ userId: "user_1" });
    expect(args.orderBy).toEqual({ createdAt: "desc" });
    const body = await res.json();
    expect(body.standups[0].id).toBe("doc_1");
  });

  it("404s when fetching another user's standup", async () => {
    authMock.mockResolvedValue({ user: { id: "user_2" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(storedDoc as any);

    const res = await getStandup(jsonReq("/api/standups/doc_1", "GET"), {
      params: Promise.resolve({ id: "doc_1" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/standups/:id (A5 — user edits win)", () => {
  it("updates contentMd for the owner", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(storedDoc as any);
    prismaMock.standupDoc.update.mockResolvedValue({
      ...storedDoc,
      contentMd: "## Edited",
    } as any);

    const res = await patchStandup(
      jsonReq("/api/standups/doc_1", "PATCH", { contentMd: "## Edited" }),
      { params: Promise.resolve({ id: "doc_1" }) }
    );
    expect(res.status).toBe(200);
    expect(prismaMock.standupDoc.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "doc_1" },
        data: expect.objectContaining({ contentMd: "## Edited" }),
      })
    );
  });

  it("404s for non-owners without updating", async () => {
    authMock.mockResolvedValue({ user: { id: "user_2" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(storedDoc as any);

    const res = await patchStandup(
      jsonReq("/api/standups/doc_1", "PATCH", { contentMd: "## Hax" }),
      { params: Promise.resolve({ id: "doc_1" }) }
    );
    expect(res.status).toBe(404);
    expect(prismaMock.standupDoc.update).not.toHaveBeenCalled();
  });

  it("400s on an empty patch", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(storedDoc as any);

    const res = await patchStandup(jsonReq("/api/standups/doc_1", "PATCH", {}), {
      params: Promise.resolve({ id: "doc_1" }),
    });
    expect(res.status).toBe(400);
  });
});
