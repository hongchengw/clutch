import type { ActivityEvent, DemoIntern, RepoListItem } from "@/lib/types";

const USER_ID = "demo-intern-maya";

const repos: RepoListItem[] = [
  {
    id: "repo-checkout",
    owner: "acme-labs",
    name: "checkout-service",
    fullName: "acme-labs/checkout-service",
    private: true,
    included: true,
    lastSyncedAt: "2026-07-18T09:00:00.000Z",
  },
  {
    id: "repo-web",
    owner: "acme-labs",
    name: "storefront-web",
    fullName: "acme-labs/storefront-web",
    private: true,
    included: true,
    lastSyncedAt: "2026-07-18T09:00:00.000Z",
  },
  {
    id: "repo-docs",
    owner: "maya-builds",
    name: "intern-notes",
    fullName: "maya-builds/intern-notes",
    private: false,
    included: true,
    lastSyncedAt: "2026-07-18T09:00:00.000Z",
  },
];

function ev(
  partial: Omit<ActivityEvent, "userId" | "provider"> & {
    userId?: string;
    provider?: ActivityEvent["provider"];
  },
): ActivityEvent {
  return {
    userId: USER_ID,
    provider: "github",
    ...partial,
  };
}

/** Realistic summer-intern activity for demo mode (no OAuth / network). */
export const demoEvents: ActivityEvent[] = [
  ev({
    id: "evt-1",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "pr-214",
    type: "pr_merged",
    title: "Add idempotent cart reservation endpoint",
    summary: "Merged PR that prevents double-charge on retry.",
    url: "https://github.com/acme-labs/checkout-service/pull/214",
    additions: 312,
    deletions: 48,
    filesChanged: 7,
    occurredAt: "2026-06-03T16:20:00.000Z",
  }),
  ev({
    id: "evt-2",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "commit-a1",
    type: "commit",
    title: "Wire reservation TTL + metrics",
    url: "https://github.com/acme-labs/checkout-service/commit/a1b2c3d",
    additions: 86,
    deletions: 12,
    filesChanged: 3,
    occurredAt: "2026-06-02T19:10:00.000Z",
  }),
  ev({
    id: "evt-3",
    repoId: "repo-web",
    repoFullName: "acme-labs/storefront-web",
    externalId: "pr-88",
    type: "pr_merged",
    title: "Fix mobile checkout sticky CTA overlap",
    url: "https://github.com/acme-labs/storefront-web/pull/88",
    additions: 54,
    deletions: 31,
    filesChanged: 4,
    occurredAt: "2026-06-10T14:05:00.000Z",
  }),
  ev({
    id: "evt-4",
    repoId: "repo-web",
    repoFullName: "acme-labs/storefront-web",
    externalId: "review-12",
    type: "review",
    title: "Review: address a11y labels on payment form",
    summary: "Approved with nits on aria-describedby.",
    url: "https://github.com/acme-labs/storefront-web/pull/79#pullrequestreview-1",
    occurredAt: "2026-06-11T15:40:00.000Z",
  }),
  ev({
    id: "evt-5",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "pr-221",
    type: "pr_opened",
    title: "Draft: experiment with payment webhook retries",
    url: "https://github.com/acme-labs/checkout-service/pull/221",
    additions: 640,
    deletions: 20,
    filesChanged: 14,
    occurredAt: "2026-06-18T18:00:00.000Z",
  }),
  ev({
    id: "evt-6",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "review-19",
    type: "review",
    title: "Review: rate-limit middleware for webhooks",
    url: "https://github.com/acme-labs/checkout-service/pull/218#pullrequestreview-2",
    occurredAt: "2026-06-20T13:15:00.000Z",
  }),
  ev({
    id: "evt-7",
    repoId: "repo-web",
    repoFullName: "acme-labs/storefront-web",
    externalId: "pr-95",
    type: "pr_merged",
    title: "Add order-status skeleton and error boundary",
    url: "https://github.com/acme-labs/storefront-web/pull/95",
    additions: 198,
    deletions: 44,
    filesChanged: 6,
    occurredAt: "2026-06-27T17:30:00.000Z",
  }),
  ev({
    id: "evt-8",
    repoId: "repo-docs",
    repoFullName: "maya-builds/intern-notes",
    externalId: "commit-b2",
    type: "commit",
    title: "Document checkout failure modes for oncall",
    url: "https://github.com/maya-builds/intern-notes/commit/b2c3d4e",
    additions: 120,
    deletions: 0,
    filesChanged: 2,
    occurredAt: "2026-07-01T21:00:00.000Z",
  }),
  ev({
    id: "evt-9",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "pr-230",
    type: "pr_merged",
    title: "Split giant webhook PR into retry + logging slices",
    summary: "Follow-up after coaching on PR size.",
    url: "https://github.com/acme-labs/checkout-service/pull/230",
    additions: 210,
    deletions: 35,
    filesChanged: 5,
    occurredAt: "2026-07-08T15:55:00.000Z",
  }),
  ev({
    id: "evt-10",
    repoId: "repo-web",
    repoFullName: "acme-labs/storefront-web",
    externalId: "review-31",
    type: "review",
    title: "Review: promo banner feature flag",
    url: "https://github.com/acme-labs/storefront-web/pull/101#pullrequestreview-3",
    occurredAt: "2026-07-09T11:20:00.000Z",
  }),
  ev({
    id: "evt-11",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "issue-44",
    type: "issue_opened",
    title: "Investigate flaky checkout e2e on staging",
    url: "https://github.com/acme-labs/checkout-service/issues/44",
    occurredAt: "2026-07-14T10:05:00.000Z",
  }),
  ev({
    id: "evt-12",
    repoId: "repo-web",
    repoFullName: "acme-labs/storefront-web",
    externalId: "pr-110",
    type: "pr_merged",
    title: "Surface shipping ETA from checkout API",
    url: "https://github.com/acme-labs/storefront-web/pull/110",
    additions: 167,
    deletions: 22,
    filesChanged: 5,
    occurredAt: "2026-07-16T19:40:00.000Z",
  }),
  ev({
    id: "evt-13",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "commit-c3",
    type: "commit",
    title: "Tighten ETA caching headers",
    url: "https://github.com/acme-labs/checkout-service/commit/c3d4e5f",
    additions: 41,
    deletions: 9,
    filesChanged: 2,
    occurredAt: "2026-07-17T14:10:00.000Z",
  }),
  ev({
    id: "evt-14",
    repoId: "repo-web",
    repoFullName: "acme-labs/storefront-web",
    externalId: "pr-112",
    type: "pr_opened",
    title: "Add resume-friendly contribution export hook",
    url: "https://github.com/acme-labs/storefront-web/pull/112",
    additions: 90,
    deletions: 4,
    filesChanged: 3,
    occurredAt: "2026-07-17T22:15:00.000Z",
  }),
  // Sparse period to trigger consistency coaching
  ev({
    id: "evt-15",
    repoId: "repo-checkout",
    repoFullName: "acme-labs/checkout-service",
    externalId: "commit-gap",
    type: "commit",
    title: "chore: bump checkout client SDK",
    url: "https://github.com/acme-labs/checkout-service/commit/d4e5f6a",
    additions: 8,
    deletions: 8,
    filesChanged: 1,
    occurredAt: "2026-06-24T12:00:00.000Z",
  }),
];

export const demoIntern: DemoIntern = {
  id: USER_ID,
  name: "Maya Chen",
  githubUsername: "maya-builds",
  internshipStartDate: "2026-05-26T00:00:00.000Z",
  internshipEndDate: "2026-08-14T23:59:59.000Z",
  repos,
  events: demoEvents,
};

export function getDemoEventsInRange(
  start: Date,
  end: Date,
): ActivityEvent[] {
  const s = start.getTime();
  const e = end.getTime();
  return demoEvents
    .filter((event) => {
      const t = new Date(event.occurredAt).getTime();
      return t >= s && t <= e;
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}
