import type {
  GitHubClient,
  GitHubCommit,
  GitHubPull,
  GitHubReview,
} from "./github";
import type { SyncRepoResult, SyncResponse } from "./types";

// Activity sync engine (A3, SPEC §7.3/§13). Normalizes GitHub activity
// into canonical ActivityEvents. Only metadata/titles/stats are stored —
// never diffs or file contents (SPEC §15).

export interface SyncUser {
  id: string;
  githubUsername: string;
  verifiedEmails: string[];
}

export interface SyncRepoRef {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  lastSyncedAt: Date | null;
}

export interface NormalizedEvent {
  userId: string;
  repoId: string;
  provider: "github";
  externalId: string;
  type:
    | "commit"
    | "pr_opened"
    | "pr_merged"
    | "pr_closed"
    | "review";
  title: string;
  summary: string | null;
  url: string;
  additions: number | null;
  deletions: number | null;
  filesChanged: number | null;
  occurredAt: Date;
}

// Structural Prisma subset — injectable for unit tests.
export interface SyncDb {
  repoSelection: {
    findMany(args: {
      where: { userId: string; included: boolean };
    }): Promise<SyncRepoRef[]>;
    update(args: {
      where: { id: string };
      data: { lastSyncedAt: Date };
    }): Promise<unknown>;
  };
  activityEvent: {
    upsert(args: {
      where: {
        provider_externalId: { provider: "github"; externalId: string };
      };
      create: NormalizedEvent;
      update: Record<string, unknown>;
    }): Promise<unknown>;
  };
}

/** SPEC §13 authorship matching: prefer login, fall back to verified emails. */
function isOwnCommit(commit: GitHubCommit, user: SyncUser): boolean {
  if (commit.authorLogin) return commit.authorLogin === user.githubUsername;
  return (
    commit.authorEmail !== null &&
    user.verifiedEmails.includes(commit.authorEmail)
  );
}

export function commitToEvent(
  commit: GitHubCommit,
  user: SyncUser,
  repo: SyncRepoRef
): NormalizedEvent | null {
  if (!isOwnCommit(commit, user)) return null;
  const [firstLine, ...rest] = commit.message.split("\n");
  return {
    userId: user.id,
    repoId: repo.id,
    provider: "github",
    externalId: `github:commit:${commit.sha}`,
    type: "commit",
    title: firstLine.trim(),
    summary: rest.join("\n").trim() || null,
    url: commit.url,
    additions: null,
    deletions: null,
    filesChanged: null,
    occurredAt: new Date(commit.date),
  };
}

export function pullToEvents(
  pull: GitHubPull,
  user: SyncUser,
  repo: SyncRepoRef
): NormalizedEvent[] {
  if (pull.authorLogin !== user.githubUsername) return [];

  const base = {
    userId: user.id,
    repoId: repo.id,
    provider: "github" as const,
    title: pull.title,
    summary: null,
    url: pull.url,
    additions: pull.additions,
    deletions: pull.deletions,
    filesChanged: pull.changedFiles,
  };
  const ref = `${repo.fullName}#${pull.number}`;

  const events: NormalizedEvent[] = [
    {
      ...base,
      externalId: `github:pr_opened:${ref}`,
      type: "pr_opened",
      occurredAt: new Date(pull.createdAt),
    },
  ];

  if (pull.merged && pull.mergedAt) {
    events.push({
      ...base,
      externalId: `github:pr_merged:${ref}`,
      type: "pr_merged",
      occurredAt: new Date(pull.mergedAt),
    });
  } else if (pull.state === "closed" && pull.closedAt) {
    events.push({
      ...base,
      externalId: `github:pr_closed:${ref}`,
      type: "pr_closed",
      occurredAt: new Date(pull.closedAt),
    });
  }

  return events;
}

export function reviewToEvent(
  review: GitHubReview,
  user: SyncUser,
  repo: SyncRepoRef
): NormalizedEvent | null {
  // Only reviews the user gave on someone else's PR count (SPEC §12).
  if (review.authorLogin !== user.githubUsername) return null;
  if (review.prAuthorLogin === user.githubUsername) return null;
  return {
    userId: user.id,
    repoId: repo.id,
    provider: "github",
    externalId: `github:review:${review.id}`,
    type: "review",
    title: `Reviewed "${review.prTitle}" (${review.state.toLowerCase()})`,
    summary: null,
    url: review.url,
    additions: null,
    deletions: null,
    filesChanged: null,
    occurredAt: new Date(review.submittedAt),
  };
}

async function syncRepo(
  db: SyncDb,
  client: GitHubClient,
  user: SyncUser,
  repo: SyncRepoRef,
  now: Date
): Promise<SyncRepoResult> {
  try {
    const since = repo.lastSyncedAt?.toISOString();
    const [commits, pulls, reviews] = [
      await client.listCommits(
        repo.owner,
        repo.name,
        since ? { since } : {}
      ),
      await client.listPulls(repo.owner, repo.name),
      await client.listReviews(repo.owner, repo.name),
    ];

    const events: NormalizedEvent[] = [];
    for (const c of commits) {
      const ev = commitToEvent(c, user, repo);
      if (ev) events.push(ev);
    }
    for (const p of pulls) {
      // Incremental: skip PRs untouched since the last sync.
      if (repo.lastSyncedAt && new Date(p.updatedAt) <= repo.lastSyncedAt) {
        continue;
      }
      events.push(...pullToEvents(p, user, repo));
    }
    for (const r of reviews) {
      if (repo.lastSyncedAt && new Date(r.submittedAt) <= repo.lastSyncedAt) {
        continue;
      }
      const ev = reviewToEvent(r, user, repo);
      if (ev) events.push(ev);
    }

    for (const event of events) {
      await db.activityEvent.upsert({
        where: {
          provider_externalId: {
            provider: "github",
            externalId: event.externalId,
          },
        },
        create: event,
        update: {
          title: event.title,
          summary: event.summary,
          additions: event.additions,
          deletions: event.deletions,
          filesChanged: event.filesChanged,
        },
      });
    }

    await db.repoSelection.update({
      where: { id: repo.id },
      data: { lastSyncedAt: now },
    });

    return {
      fullName: repo.fullName,
      status: "synced",
      newEvents: events.length,
      lastSyncedAt: now.toISOString(),
    };
  } catch (err) {
    return {
      fullName: repo.fullName,
      status: "error",
      newEvents: 0,
      lastSyncedAt: repo.lastSyncedAt?.toISOString() ?? null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function syncAllRepos(
  db: SyncDb,
  client: GitHubClient,
  user: SyncUser,
  now: Date = new Date()
): Promise<SyncResponse> {
  const repos = await db.repoSelection.findMany({
    where: { userId: user.id, included: true },
  });

  const results: SyncRepoResult[] = [];
  for (const repo of repos) {
    results.push(await syncRepo(db, client, user, repo, now));
  }

  return { repos: results, syncedAt: now.toISOString() };
}
