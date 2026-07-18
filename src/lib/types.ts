// Shared contract types between Person A's APIs and Person B's UI.
// Keep these stable — the dashboard, standup generator, and demo seed
// data all depend on them (TASK.md integration checkpoints).

export type ActivityEventType =
  | "commit"
  | "pr_opened"
  | "pr_merged"
  | "pr_closed"
  | "review"
  | "issue_opened"
  | "issue_closed"
  | "comment";

export interface ActivityEventDTO {
  id: string;
  repoId: string;
  repoFullName: string;
  provider: "github" | "gitlab";
  externalId: string;
  type: ActivityEventType;
  title: string;
  summary: string | null;
  url: string;
  additions: number | null;
  deletions: number | null;
  filesChanged: number | null;
  occurredAt: string; // ISO 8601
}

export interface MetricsDTO {
  rangeStart: string;
  rangeEnd: string;
  prsOpened: number;
  prsMerged: number;
  reviewsGiven: number;
  commits: number;
  activeRepos: number;
  /** Days with ≥1 event / working days (Mon–Fri) in range, 0..1 */
  consistency: number;
}

export type StandupRangePreset =
  | "yesterday"
  | "last7"
  | "last30"
  | "custom"
  | "internship";

export type StandupTone = "casual" | "professional" | "resume";
export type StandupLength = "short" | "standard" | "detailed";

export interface StandupSectionBullet {
  text: string;
  /** ActivityEvent ids backing this bullet — every claim needs a receipt */
  eventIds: string[];
  /** Direct link to the PR/commit/review as proof */
  url: string | null;
}

export interface StandupContent {
  didYesterday: StandupSectionBullet[];
  doingNext: StandupSectionBullet[];
  blockers: StandupSectionBullet[];
  proofLinks: { label: string; url: string }[];
}

export interface StandupDocDTO {
  id: string;
  rangeStart: string;
  rangeEnd: string;
  tone: StandupTone;
  length: StandupLength;
  contentMd: string;
  contentJson: StandupContent | null;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RepoDTO {
  githubRepoId: string;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  included: boolean;
  lastSyncedAt: string | null;
}

export interface SyncRepoResult {
  fullName: string;
  status: "synced" | "error";
  newEvents: number;
  lastSyncedAt: string | null;
  error?: string;
}

export interface SyncResponse {
  repos: SyncRepoResult[];
  syncedAt: string;
}
