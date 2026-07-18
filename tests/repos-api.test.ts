import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

const listUserRepos = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep() };
});
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/github", () => ({
  createGitHubClient: () => ({ listUserRepos }),
  getGitHubToken: vi.fn().mockResolvedValue("tok_decrypted"),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/repos/route";
import { POST } from "@/app/api/repos/selection/route";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const authMock = auth as unknown as Mock;

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("GET /api/repos (A2)", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    authMock.mockReset();
    listUserRepos.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("merges GitHub repos with stored inclusion flags", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    listUserRepos.mockResolvedValue([
      {
        githubRepoId: "42",
        owner: "maya",
        name: "shiplog",
        fullName: "maya/shiplog",
        private: true,
      },
      {
        githubRepoId: "43",
        owner: "maya",
        name: "dotfiles",
        fullName: "maya/dotfiles",
        private: false,
      },
    ]);
    prismaMock.repoSelection.findMany.mockResolvedValue([
      {
        githubRepoId: "42",
        included: true,
        lastSyncedAt: new Date("2026-07-17T08:00:00Z"),
      },
    ] as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.repos).toHaveLength(2);
    const shiplog = body.repos.find((r: any) => r.githubRepoId === "42");
    expect(shiplog.included).toBe(true);
    expect(shiplog.lastSyncedAt).toBe("2026-07-17T08:00:00.000Z");
    const dotfiles = body.repos.find((r: any) => r.githubRepoId === "43");
    expect(dotfiles.included).toBe(false);
  });
});

describe("POST /api/repos/selection (A2)", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    authMock.mockReset();
  });

  function req(body: unknown) {
    return new Request("http://localhost/api/repos/selection", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  const selection = {
    repos: [
      {
        githubRepoId: "42",
        owner: "maya",
        name: "shiplog",
        fullName: "maya/shiplog",
        private: true,
        included: true,
      },
    ],
  };

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(req(selection));
    expect(res.status).toBe(401);
  });

  it("upserts each repo selection scoped to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.repoSelection.upsert.mockResolvedValue({} as any);

    const res = await POST(req(selection));
    expect(res.status).toBe(200);
    expect(prismaMock.repoSelection.upsert).toHaveBeenCalledTimes(1);
    const args = prismaMock.repoSelection.upsert.mock.calls[0][0];
    expect(args.where).toEqual({
      userId_provider_githubRepoId: {
        userId: "user_1",
        provider: "github",
        githubRepoId: "42",
      },
    });
    expect(args.create).toMatchObject({
      userId: "user_1",
      included: true,
      fullName: "maya/shiplog",
    });
    expect(args.update).toMatchObject({ included: true });
  });

  it("can toggle a repo off (included: false persists)", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.repoSelection.upsert.mockResolvedValue({} as any);

    const body = {
      repos: [{ ...selection.repos[0], included: false }],
    };
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    const args = prismaMock.repoSelection.upsert.mock.calls[0][0];
    expect(args.update).toMatchObject({ included: false });
  });

  it("rejects malformed payloads with 400", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    const res = await POST(req({ repos: [{ nope: true }] }));
    expect(res.status).toBe(400);
    expect(prismaMock.repoSelection.upsert).not.toHaveBeenCalled();
  });
});
