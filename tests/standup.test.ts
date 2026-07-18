import { describe, it, expect } from "vitest";
import { generateStandup, validateGrounding } from "@/lib/standup";
import type { ActivityEventDTO, StandupContent } from "@/lib/types";

function ev(overrides: Partial<ActivityEventDTO>): ActivityEventDTO {
  return {
    id: "ev_x",
    repoId: "repo_1",
    repoFullName: "acme/shiplog",
    provider: "github",
    externalId: "github:x",
    type: "commit",
    title: "chore: tidy",
    summary: null,
    url: "https://github.com/acme/shiplog/commit/x",
    additions: null,
    deletions: null,
    filesChanged: null,
    occurredAt: "2026-07-17T10:00:00.000Z",
    ...overrides,
  };
}

const mergedPr = ev({
  id: "ev_merged",
  type: "pr_merged",
  title: "Add repo selection API",
  url: "https://github.com/acme/shiplog/pull/7",
  additions: 120,
  deletions: 30,
});
const openPr = ev({
  id: "ev_open",
  type: "pr_opened",
  title: "Sync engine incremental mode",
  url: "https://github.com/acme/shiplog/pull/9",
});
const review = ev({
  id: "ev_review",
  type: "review",
  title: 'Reviewed "Refactor worker" (approved)',
  url: "https://github.com/acme/shiplog/pull/12#r1",
});
const commit = ev({
  id: "ev_commit",
  type: "commit",
  title: "fix: resolve login redirect loop",
});

describe("generateStandup (A5 — SPEC §7.4/§10 grounding)", () => {
  it("cites only real event ids on every bullet", () => {
    const { contentJson, eventIds } = generateStandup(
      [mergedPr, openPr, review, commit],
      { tone: "casual", length: "standard" }
    );
    const inputIds = new Set(["ev_merged", "ev_open", "ev_review", "ev_commit"]);
    const allBullets = [
      ...contentJson.didYesterday,
      ...contentJson.doingNext,
      ...contentJson.blockers,
    ];
    expect(allBullets.length).toBeGreaterThan(0);
    for (const b of allBullets) {
      expect(b.eventIds.length).toBeGreaterThan(0);
      for (const id of b.eventIds) expect(inputIds.has(id)).toBe(true);
    }
    for (const id of eventIds) expect(inputIds.has(id)).toBe(true);
  });

  it("puts merged PRs in 'did' and still-open PRs in 'next'", () => {
    const { contentJson } = generateStandup([mergedPr, openPr], {
      tone: "professional",
      length: "standard",
    });
    const didText = contentJson.didYesterday.map((b) => b.text).join(" ");
    const nextText = contentJson.doingNext.map((b) => b.text).join(" ");
    expect(didText).toContain("Add repo selection API");
    expect(nextText).toContain("Sync engine incremental mode");
  });

  it("renders markdown with sections and proof links", () => {
    const { contentMd } = generateStandup([mergedPr, review], {
      tone: "casual",
      length: "standard",
    });
    expect(contentMd).toMatch(/What I did/i);
    expect(contentMd).toMatch(/Blockers/i);
    expect(contentMd).toContain("https://github.com/acme/shiplog/pull/7");
  });

  it("handles an empty range without inventing work", () => {
    const { contentMd, contentJson, eventIds } = generateStandup([], {
      tone: "casual",
      length: "short",
    });
    expect(eventIds).toEqual([]);
    expect(contentJson.didYesterday).toEqual([]);
    expect(contentMd).toMatch(/no tracked activity/i);
  });

  it("highlight mode lists merged PRs before commits", () => {
    const { contentJson } = generateStandup([commit, mergedPr], {
      tone: "professional",
      length: "standard",
      highlightMode: true,
    });
    expect(contentJson.didYesterday[0].eventIds).toContain("ev_merged");
  });
});

describe("validateGrounding (A5 — SPEC §10 post-validation)", () => {
  it("strips bullets citing unknown event ids", () => {
    const content: StandupContent = {
      didYesterday: [
        { text: "Real work", eventIds: ["ev_merged"], url: mergedPr.url },
        { text: "Invented work", eventIds: ["ev_fake"], url: null },
        { text: "No receipts at all", eventIds: [], url: null },
      ],
      doingNext: [],
      blockers: [],
      proofLinks: [],
    };
    const cleaned = validateGrounding(content, new Set(["ev_merged"]));
    expect(cleaned.didYesterday).toHaveLength(1);
    expect(cleaned.didYesterday[0].text).toBe("Real work");
  });

  it("keeps user-editable blockers even without citations", () => {
    const content: StandupContent = {
      didYesterday: [],
      doingNext: [],
      blockers: [{ text: "Waiting on staging access", eventIds: [], url: null }],
      proofLinks: [],
    };
    const cleaned = validateGrounding(content, new Set());
    expect(cleaned.blockers).toHaveLength(1);
  });
});
