import { describe, it, expect } from "vitest";
import { commitToEvent, pullToEvents, reviewToEvent } from "@/lib/sync";
import { computeMetrics, type MetricsEvent } from "@/lib/metrics";
import { resolveRange } from "@/lib/range";
import { generateStandup } from "@/lib/standup";
import { encryptToken, decryptToken } from "@/lib/crypto";
import type { ActivityEventDTO } from "@/lib/types";
import type { GitHubCommit, GitHubPull, GitHubReview } from "@/lib/github";

// Deterministic acceptance suite: verifies SPEC.md invariants directly,
// on a fixed synthetic "summer internship" dataset. No randomness, no
// clock reads, no network — every value below is pinned.

const user = {
  id: "user_maya",
  githubUsername: "maya-intern",
  verifiedEmails: ["maya@example.com"],
};
const repo = {
  id: "repo_1",
  owner: "acme",
  name: "checkout",
  fullName: "acme/checkout",
  lastSyncedAt: null,
};

const CANONICAL_TYPES = [
  "commit",
  "pr_opened",
  "pr_merged",
  "pr_closed",
  "review",
  "issue_opened",
  "issue_closed",
  "comment",
];

describe("SPEC §7.3/§11 — canonical ActivityEvent normalization", () => {
  const commit: GitHubCommit = {
    sha: "c1",
    message: "feat: add cart badge",
    authorLogin: "maya-intern",
    authorEmail: "maya@example.com",
    date: "2026-06-15T10:00:00Z",
    url: "https://github.com/acme/checkout/commit/c1",
  };
  const pull: GitHubPull = {
    number: 3,
    title: "Cart badge",
    state: "closed",
    draft: false,
    merged: true,
    authorLogin: "maya-intern",
    createdAt: "2026-06-15T09:00:00Z",
    mergedAt: "2026-06-16T12:00:00Z",
    closedAt: "2026-06-16T12:00:00Z",
    updatedAt: "2026-06-16T12:00:00Z",
    additions: 50,
    deletions: 5,
    changedFiles: 3,
    url: "https://github.com/acme/checkout/pull/3",
  };
  const review: GitHubReview = {
    id: 9,
    prNumber: 5,
    prTitle: "Fix flaky test",
    prAuthorLogin: "sam",
    state: "APPROVED",
    authorLogin: "maya-intern",
    submittedAt: "2026-06-17T10:00:00Z",
    url: "https://github.com/acme/checkout/pull/5#r9",
  };

  const events = [
    commitToEvent(commit, user, repo)!,
    ...pullToEvents(pull, user, repo),
    reviewToEvent(review, user, repo)!,
  ];

  it("every normalized event uses a canonical type", () => {
    for (const ev of events) {
      expect(CANONICAL_TYPES).toContain(ev.type);
    }
  });

  it("SPEC §15 — stores only metadata: no diffs, patches, or file contents", () => {
    const allowedKeys = new Set([
      "userId",
      "repoId",
      "provider",
      "externalId",
      "type",
      "title",
      "summary",
      "url",
      "additions",
      "deletions",
      "filesChanged",
      "occurredAt",
    ]);
    for (const ev of events) {
      for (const key of Object.keys(ev)) {
        expect(allowedKeys.has(key), `unexpected field ${key}`).toBe(true);
      }
      // size stats are numbers or null — never file blobs
      expect(["number", "object"]).toContain(typeof ev.additions);
    }
  });

  it("SPEC §4 — every event carries a proof URL back to GitHub", () => {
    for (const ev of events) {
      expect(ev.url).toMatch(/^https:\/\/github\.com\//);
    }
  });
});

describe("SPEC §12 — metric definitions on a pinned summer dataset", () => {
  // June 1 – Aug 28, 2026. Hand-computed expectations below.
  const range = {
    start: new Date("2026-06-01T00:00:00Z"),
    end: new Date("2026-08-28T23:59:59Z"),
  };
  const mk = (
    type: MetricsEvent["type"],
    repoId: string,
    iso: string
  ): MetricsEvent => ({ type, repoId, occurredAt: new Date(iso) });

  const events: MetricsEvent[] = [
    // 14 merged PRs, one per weekday starting Mon Jun 1
    ...Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 5, 1 + Math.floor(i / 5) * 7 + (i % 5)));
      return mk("pr_merged", i < 10 ? "repo_a" : "repo_b", d.toISOString());
    }),
    ...Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 5, 1 + Math.floor(i / 5) * 7 + (i % 5)));
      return mk("pr_opened", i < 10 ? "repo_a" : "repo_b", d.toISOString());
    }),
    // 22 reviews across July in repo_c
    ...Array.from({ length: 22 }, (_, i) =>
      mk("review", "repo_c", `2026-07-${String(1 + i).padStart(2, "0")}T12:00:00Z`)
    ),
    // 40 commits in August in repo_a
    ...Array.from({ length: 20 }, (_, i) =>
      mk("commit", "repo_a", `2026-08-${String(3 + i).padStart(2, "0")}T09:00:00Z`)
    ),
    ...Array.from({ length: 20 }, (_, i) =>
      mk("commit", "repo_a", `2026-08-${String(3 + i).padStart(2, "0")}T17:00:00Z`)
    ),
  ];

  const m = computeMetrics(events, range);

  it("counts match the resume-bullet examples exactly", () => {
    // "Merged 14 pull requests across 3 production repositories" (§12)
    expect(m.prsMerged).toBe(14);
    expect(m.prsOpened).toBe(14);
    // "Completed 22 code reviews for teammates"
    expect(m.reviewsGiven).toBe(22);
    expect(m.commits).toBe(40);
    expect(m.activeRepos).toBe(3);
  });

  it("consistency stays within [0, 1] and is deterministic", () => {
    expect(m.consistency).toBeGreaterThan(0);
    expect(m.consistency).toBeLessThanOrEqual(1);
    // Same inputs -> identical output (pure function)
    expect(computeMetrics(events, range)).toEqual(m);
  });
});

describe("SPEC §7.4/§21 — standup ranges and grounding", () => {
  const now = new Date("2026-08-28T17:00:00Z");

  it("supports 'yesterday' and 'full internship' (acceptance criterion 2)", () => {
    const yesterday = resolveRange({ preset: "yesterday" }, { now });
    expect(yesterday.start.toISOString()).toBe("2026-08-27T00:00:00.000Z");

    const internship = resolveRange(
      { preset: "internship" },
      { now, internshipStartDate: new Date("2026-06-01T00:00:00Z") }
    );
    expect(internship.start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(internship.end).toEqual(now);
  });

  it("acceptance criterion 3 — generated content cites real PR/commit links", () => {
    const events: ActivityEventDTO[] = [
      {
        id: "ev_pr",
        repoId: "repo_1",
        repoFullName: "acme/checkout",
        provider: "github",
        externalId: "github:pr_merged:acme/checkout#3",
        type: "pr_merged",
        title: "Cart badge",
        summary: null,
        url: "https://github.com/acme/checkout/pull/3",
        additions: 50,
        deletions: 5,
        filesChanged: 3,
        occurredAt: "2026-08-27T12:00:00.000Z",
      },
    ];
    const { contentMd, contentJson, eventIds } = generateStandup(events, {
      tone: "professional",
      length: "standard",
    });

    expect(eventIds).toEqual(["ev_pr"]);
    expect(contentMd).toContain("https://github.com/acme/checkout/pull/3");
    for (const b of contentJson.didYesterday) {
      expect(b.eventIds.every((id) => id === "ev_pr")).toBe(true);
    }
  });

  it("SPEC §20 — generation is deterministic with no AI key (template fallback)", () => {
    const events: ActivityEventDTO[] = [];
    const a = generateStandup(events, { tone: "casual", length: "short" });
    const b = generateStandup(events, { tone: "casual", length: "short" });
    expect(a).toEqual(b);
  });
});

describe("SPEC §15 — OAuth tokens encrypted at rest (acceptance)", () => {
  it("a stored token is unreadable without the key and exact ciphertext", () => {
    const stored = encryptToken("gho_realtoken");
    expect(stored).not.toContain("gho_realtoken");
    expect(decryptToken(stored)).toBe("gho_realtoken");
  });
});
