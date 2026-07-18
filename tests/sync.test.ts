import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  commitToEvent,
  pullToEvents,
  reviewToEvent,
  syncAllRepos,
  type SyncUser,
} from "@/lib/sync";
import type {
  GitHubClient,
  GitHubCommit,
  GitHubPull,
  GitHubReview,
} from "@/lib/github";

const user: SyncUser = {
  id: "user_1",
  githubUsername: "maya-intern",
  verifiedEmails: ["maya@example.com"],
};

const repo = {
  id: "repo_1",
  owner: "acme",
  name: "shiplog",
  fullName: "acme/shiplog",
  lastSyncedAt: null as Date | null,
};

const baseCommit: GitHubCommit = {
  sha: "abc123",
  message: "fix: resolve login redirect loop\n\nlonger body here",
  authorLogin: "maya-intern",
  authorEmail: "maya@example.com",
  date: "2026-07-10T14:00:00Z",
  url: "https://github.com/acme/shiplog/commit/abc123",
};

const basePull: GitHubPull = {
  number: 7,
  title: "Add repo selection API",
  state: "closed",
  draft: false,
  merged: true,
  authorLogin: "maya-intern",
  createdAt: "2026-07-08T09:00:00Z",
  mergedAt: "2026-07-09T16:00:00Z",
  closedAt: "2026-07-09T16:00:00Z",
  updatedAt: "2026-07-09T16:00:00Z",
  additions: 120,
  deletions: 30,
  changedFiles: 6,
  url: "https://github.com/acme/shiplog/pull/7",
};

const baseReview: GitHubReview = {
  id: 555,
  prNumber: 12,
  prTitle: "Refactor sync worker",
  prAuthorLogin: "someone-else",
  state: "APPROVED",
  authorLogin: "maya-intern",
  submittedAt: "2026-07-11T10:00:00Z",
  url: "https://github.com/acme/shiplog/pull/12#pullrequestreview-555",
};

describe("commit normalization + authorship (A3 — SPEC §13)", () => {
  it("normalizes an authored commit to a canonical ActivityEvent", () => {
    const ev = commitToEvent(baseCommit, user, repo);
    expect(ev).toMatchObject({
      userId: "user_1",
      repoId: "repo_1",
      provider: "github",
      externalId: "github:commit:abc123",
      type: "commit",
      title: "fix: resolve login redirect loop",
      url: baseCommit.url,
      occurredAt: new Date("2026-07-10T14:00:00Z"),
    });
  });

  it("matches authorship by verified email when login is missing", () => {
    const ev = commitToEvent({ ...baseCommit, authorLogin: null }, user, repo);
    expect(ev).not.toBeNull();
  });

  it("excludes commits authored by someone else", () => {
    const ev = commitToEvent(
      {
        ...baseCommit,
        authorLogin: "other-dev",
        authorEmail: "other@example.com",
      },
      user,
      repo
    );
    expect(ev).toBeNull();
  });
});

describe("PR normalization (A3)", () => {
  it("emits pr_opened and pr_merged for a merged PR with size stats", () => {
    const events = pullToEvents(basePull, user, repo);
    expect(events.map((e) => e.type)).toEqual(["pr_opened", "pr_merged"]);
    const merged = events[1];
    expect(merged).toMatchObject({
      externalId: "github:pr_merged:acme/shiplog#7",
      additions: 120,
      deletions: 30,
      filesChanged: 6,
      occurredAt: new Date("2026-07-09T16:00:00Z"),
    });
  });

  it("emits pr_closed (not pr_merged) for closed-unmerged PRs", () => {
    const events = pullToEvents(
      { ...basePull, merged: false, mergedAt: null },
      user,
      repo
    );
    expect(events.map((e) => e.type)).toEqual(["pr_opened", "pr_closed"]);
  });

  it("emits only pr_opened for an open PR", () => {
    const events = pullToEvents(
      { ...basePull, state: "open", merged: false, mergedAt: null, closedAt: null },
      user,
      repo
    );
    expect(events.map((e) => e.type)).toEqual(["pr_opened"]);
  });

  it("ignores PRs authored by others", () => {
    expect(pullToEvents({ ...basePull, authorLogin: "other" }, user, repo)).toEqual(
      []
    );
  });
});

describe("review normalization (A3)", () => {
  it("normalizes a review submitted by the user on someone else's PR", () => {
    const ev = reviewToEvent(baseReview, user, repo);
    expect(ev).toMatchObject({
      type: "review",
      externalId: "github:review:555",
      title: expect.stringContaining("Refactor sync worker"),
    });
  });

  it("excludes reviews by others and self-reviews on own PRs", () => {
    expect(
      reviewToEvent({ ...baseReview, authorLogin: "other" }, user, repo)
    ).toBeNull();
    expect(
      reviewToEvent({ ...baseReview, prAuthorLogin: "maya-intern" }, user, repo)
    ).toBeNull();
  });
});

describe("syncAllRepos (A3 — incremental + idempotent)", () => {
  function makeDb() {
    return {
      repoSelection: {
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      activityEvent: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
  }

  function makeClient(overrides: Partial<GitHubClient> = {}): GitHubClient {
    return {
      listUserRepos: vi.fn().mockResolvedValue([]),
      listCommits: vi.fn().mockResolvedValue([baseCommit]),
      listPulls: vi.fn().mockResolvedValue([basePull]),
      listReviews: vi.fn().mockResolvedValue([baseReview]),
      ...overrides,
    };
  }

  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    db.repoSelection.findMany.mockResolvedValue([
      { ...repo, included: true, lastSyncedAt: null },
    ]);
  });

  it("upserts normalized events for every included repo", async () => {
    const result = await syncAllRepos(db, makeClient(), user);

    // commit + pr_opened + pr_merged + review = 4 events
    expect(db.activityEvent.upsert).toHaveBeenCalledTimes(4);
    const externalIds = db.activityEvent.upsert.mock.calls.map(
      (c) => c[0].where.provider_externalId.externalId
    );
    expect(externalIds).toContain("github:commit:abc123");
    expect(externalIds).toContain("github:pr_merged:acme/shiplog#7");
    expect(result.repos[0]).toMatchObject({
      fullName: "acme/shiplog",
      status: "synced",
      newEvents: 4,
    });
  });

  it("uses upsert keyed by provider+externalId so re-syncs never duplicate", async () => {
    await syncAllRepos(db, makeClient(), user);
    for (const call of db.activityEvent.upsert.mock.calls) {
      expect(call[0].where.provider_externalId).toBeDefined();
      expect(call[0].update).toBeDefined();
    }
  });

  it("passes since=lastSyncedAt for incremental commit fetches and skips stale PRs", async () => {
    const last = new Date("2026-07-10T00:00:00Z");
    db.repoSelection.findMany.mockResolvedValue([
      { ...repo, included: true, lastSyncedAt: last },
    ]);
    const client = makeClient({
      listPulls: vi
        .fn()
        .mockResolvedValue([{ ...basePull, updatedAt: "2026-07-01T00:00:00Z" }]),
      listReviews: vi.fn().mockResolvedValue([]),
    });

    await syncAllRepos(db, client, user);

    expect(client.listCommits).toHaveBeenCalledWith("acme", "shiplog", {
      since: last.toISOString(),
    });
    // stale PR (updated before lastSyncedAt) contributes no events
    const types = db.activityEvent.upsert.mock.calls.map(
      (c) => c[0].create.type
    );
    expect(types).toEqual(["commit"]);
  });

  it("updates lastSyncedAt only after a successful repo sync", async () => {
    const now = new Date("2026-07-18T09:00:00Z");
    await syncAllRepos(db, makeClient(), user, now);
    expect(db.repoSelection.update).toHaveBeenCalledWith({
      where: { id: "repo_1" },
      data: { lastSyncedAt: now },
    });
  });

  it("reports per-repo errors without updating lastSyncedAt", async () => {
    const client = makeClient({
      listCommits: vi.fn().mockRejectedValue(new Error("GitHub API 403")),
    });
    const result = await syncAllRepos(db, client, user);
    expect(result.repos[0].status).toBe("error");
    expect(result.repos[0].error).toContain("403");
    expect(db.repoSelection.update).not.toHaveBeenCalled();
  });
});
