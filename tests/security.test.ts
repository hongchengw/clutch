import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import { createGitHubClient } from "@/lib/github";

vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep() };
});
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { POST as postSelection } from "@/app/api/repos/selection/route";
import { PATCH as patchStandup } from "@/app/api/standups/[id]/route";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const authMock = auth as unknown as Mock;

/* eslint-disable @typescript-eslint/no-explicit-any */

function jsonReq(url: string, method: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  mockReset(prismaMock);
  authMock.mockReset();
});

describe("F1: GitHub API path injection (audit — repo identifiers)", () => {
  const validRepo = {
    githubRepoId: "42",
    owner: "maya",
    name: "shiplog",
    fullName: "maya/shiplog",
    private: false,
    included: true,
  };

  it.each([
    ["owner with slash", { ...validRepo, owner: "maya/other-repo" }],
    ["owner traversal", { ...validRepo, owner: ".." }],
    ["name with slash", { ...validRepo, name: "shiplog/commits" }],
    ["name with query metachars", { ...validRepo, name: "shiplog?x=1" }],
    ["name traversal", { ...validRepo, name: "." }],
    ["owner with space", { ...validRepo, owner: "maya intern" }],
  ])("rejects %s with 400 before persisting", async (_label, repo) => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    const res = await postSelection(
      jsonReq("/api/repos/selection", "POST", { repos: [repo] })
    );
    expect(res.status).toBe(400);
    expect(prismaMock.repoSelection.upsert).not.toHaveBeenCalled();
  });

  it("still accepts real-world owner/name characters (dots, dashes, underscores)", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.repoSelection.upsert.mockResolvedValue({} as any);
    const res = await postSelection(
      jsonReq("/api/repos/selection", "POST", {
        repos: [
          {
            ...validRepo,
            owner: "my-org_2",
            name: "repo.name-v2_final",
            fullName: "my-org_2/repo.name-v2_final",
          },
        ],
      })
    );
    expect(res.status).toBe(200);
  });

  it("URL-encodes owner and name segments in commit fetches (defense in depth)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const client = createGitHubClient("tok", fetchMock);
    await client.listCommits("weird owner", "name?x=1");

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/repos/weird%20owner/name%3Fx%3D1/commits");
    expect(url).not.toContain("weird owner");
  });
});

describe("F2: unbounded standup edits (audit — PATCH limits)", () => {
  const ownedDoc = {
    id: "doc_1",
    userId: "user_1",
    rangeStart: new Date(),
    rangeEnd: new Date(),
    tone: "casual",
    length: "standard",
    contentMd: "x",
    contentJson: null,
    eventIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("rejects contentMd larger than 200k chars with 400", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(ownedDoc as any);

    const res = await patchStandup(
      jsonReq("/api/standups/doc_1", "PATCH", {
        contentMd: "a".repeat(200_001),
      }),
      { params: Promise.resolve({ id: "doc_1" }) }
    );
    expect(res.status).toBe(400);
    expect(prismaMock.standupDoc.update).not.toHaveBeenCalled();
  });

  it("rejects contentJson that is not a StandupContent shape", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(ownedDoc as any);

    const res = await patchStandup(
      jsonReq("/api/standups/doc_1", "PATCH", {
        contentJson: { didYesterday: "not-an-array" },
      }),
      { params: Promise.resolve({ id: "doc_1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("accepts a well-formed StandupContent edit", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.standupDoc.findUnique.mockResolvedValue(ownedDoc as any);
    prismaMock.standupDoc.update.mockResolvedValue(ownedDoc as any);

    const res = await patchStandup(
      jsonReq("/api/standups/doc_1", "PATCH", {
        contentJson: {
          didYesterday: [
            { text: "Shipped it", eventIds: ["ev_1"], url: null },
          ],
          doingNext: [],
          blockers: [],
          proofLinks: [],
        },
      }),
      { params: Promise.resolve({ id: "doc_1" }) }
    );
    expect(res.status).toBe(200);
  });
});
