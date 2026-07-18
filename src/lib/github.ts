import { decryptToken } from "./crypto";
import { prisma } from "./prisma";

// Thin fetch-based GitHub REST client (A2/A3). Injectable fetch keeps
// every consumer unit-testable without network access.

const API = "https://api.github.com";
const PER_PAGE = 100;

export interface GitHubRepoSummary {
  githubRepoId: string;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorEmail: string | null;
  date: string;
  url: string;
}

export interface GitHubPull {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  authorLogin: string;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  url: string;
}

export interface GitHubReview {
  id: number;
  prNumber: number;
  prTitle: string;
  prAuthorLogin: string;
  state: string;
  authorLogin: string;
  submittedAt: string;
  url: string;
}

export interface GitHubClient {
  listUserRepos(): Promise<GitHubRepoSummary[]>;
  listCommits(
    owner: string,
    repo: string,
    opts?: { since?: string }
  ): Promise<GitHubCommit[]>;
  listPulls(owner: string, repo: string): Promise<GitHubPull[]>;
  listReviews(owner: string, repo: string): Promise<GitHubReview[]>;
}

type FetchLike = (
  url: string,
  init: { headers: Record<string, string> }
) => Promise<Response>;

export function createGitHubClient(
  token: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike
): GitHubClient {
  async function request<T>(path: string): Promise<T> {
    const res = await fetchImpl(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} for ${path}`);
    }
    return (await res.json()) as T;
  }

  async function paginate<T>(pathWithQuery: string): Promise<T[]> {
    const sep = pathWithQuery.includes("?") ? "&" : "?";
    const all: T[] = [];
    for (let page = 1; ; page++) {
      const items = await request<T[]>(
        `${pathWithQuery}${sep}per_page=${PER_PAGE}&page=${page}`
      );
      all.push(...items);
      if (items.length < PER_PAGE) return all;
    }
  }

  return {
    async listUserRepos() {
      type RawRepo = {
        id: number;
        name: string;
        full_name: string;
        owner: { login: string };
        private: boolean;
      };
      const raw = await paginate<RawRepo>("/user/repos?sort=updated");
      return raw.map((r) => ({
        githubRepoId: String(r.id),
        owner: r.owner.login,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
      }));
    },

    async listCommits(owner, repo, opts = {}) {
      type RawCommit = {
        sha: string;
        html_url: string;
        commit: {
          message: string;
          author: { email: string | null; date: string } | null;
        };
        author: { login: string } | null;
      };
      const since = opts.since ? `?since=${encodeURIComponent(opts.since)}` : "";
      const raw = await paginate<RawCommit>(
        `/repos/${owner}/${repo}/commits${since}`
      );
      return raw.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        authorLogin: c.author?.login ?? null,
        authorEmail: c.commit.author?.email ?? null,
        date: c.commit.author?.date ?? "",
        url: c.html_url,
      }));
    },

    async listPulls(owner, repo) {
      type RawPull = {
        number: number;
        title: string;
        state: "open" | "closed";
        draft: boolean;
        merged_at: string | null;
        closed_at: string | null;
        created_at: string;
        updated_at: string;
        html_url: string;
        user: { login: string };
        additions?: number;
        deletions?: number;
        changed_files?: number;
      };
      const raw = await paginate<RawPull>(
        `/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc`
      );
      return raw.map((p) => ({
        number: p.number,
        title: p.title,
        state: p.state,
        draft: p.draft,
        merged: p.merged_at !== null,
        authorLogin: p.user.login,
        createdAt: p.created_at,
        mergedAt: p.merged_at,
        closedAt: p.closed_at,
        updatedAt: p.updated_at,
        additions: p.additions ?? null,
        deletions: p.deletions ?? null,
        changedFiles: p.changed_files ?? null,
        url: p.html_url,
      }));
    },

    async listReviews(owner, repo) {
      // Reviews require a PR list first; fetch reviews per PR.
      const pulls = await this.listPulls(owner, repo);
      type RawReview = {
        id: number;
        state: string;
        submitted_at: string | null;
        html_url: string;
        user: { login: string } | null;
      };
      const reviews: GitHubReview[] = [];
      for (const pr of pulls) {
        const raw = await paginate<RawReview>(
          `/repos/${owner}/${repo}/pulls/${pr.number}/reviews`
        );
        for (const r of raw) {
          if (!r.user || !r.submitted_at) continue;
          reviews.push({
            id: r.id,
            prNumber: pr.number,
            prTitle: pr.title,
            prAuthorLogin: pr.authorLogin,
            state: r.state,
            authorLogin: r.user.login,
            submittedAt: r.submitted_at,
            url: r.html_url,
          });
        }
      }
      return reviews;
    },
  };
}

/** Fetch and decrypt the stored GitHub OAuth token for a user (A1/A2). */
export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  if (!account?.access_token) return null;
  return decryptToken(account.access_token);
}
