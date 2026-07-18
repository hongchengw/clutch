/**
 * Shared API / UI contracts for ShipLog MVP.
 * Person A (platform) and Person B (UI) both import from here — keep shapes stable.
 */

export type ActivityType =
  | "commit"
  | "pr_opened"
  | "pr_merged"
  | "pr_closed"
  | "review"
  | "issue_opened"
  | "issue_closed"
  | "comment";

export type Provider = "github" | "gitlab";

export type StandupTone = "casual" | "professional" | "resume";
export type StandupLength = "short" | "standard" | "detailed";

export type DateRangeKey =
  | "yesterday"
  | "last7"
  | "last30"
  | "custom"
  | "internship";

export interface ActivityEvent {
  id: string;
  userId: string;
  repoId?: string | null;
  provider: Provider;
  externalId: string;
  type: ActivityType;
  title: string;
  summary?: string | null;
  url: string;
  additions?: number | null;
  deletions?: number | null;
  filesChanged?: number | null;
  occurredAt: string; // ISO
  repoFullName?: string;
}

export interface MetricsSummary {
  prsOpened: number;
  prsMerged: number;
  reviews: number;
  commits: number;
  reposActive: number;
  additions: number;
  deletions: number;
  consistency: number; // 0–1 working-day ratio
  streak: number; // consecutive days with ≥1 event ending at rangeEnd
}

export interface RepoListItem {
  id?: string;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  included: boolean;
  lastSyncedAt?: string | null;
  githubRepoId?: string | null;
}

export interface StandupSection {
  title: string;
  bullets: StandupBullet[];
}

export interface StandupBullet {
  text: string;
  eventId?: string;
  url?: string;
}

export interface StandupContent {
  whatIDid: StandupBullet[];
  whatsNext: StandupBullet[];
  blockers: StandupBullet[];
  proofLinks: StandupBullet[];
}

export interface StandupDoc {
  id: string;
  userId: string;
  rangeStart: string;
  rangeEnd: string;
  tone: StandupTone;
  length: StandupLength;
  contentMd: string;
  contentJson: StandupContent;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateStandupRequest {
  rangeStart: string;
  rangeEnd: string;
  tone: StandupTone;
  length: StandupLength;
  highlightMode?: boolean;
  /** When true (demo), generator runs client-side / local — no DB persistence. */
  demo?: boolean;
  events?: ActivityEvent[];
}

export interface GenerateStandupResponse {
  id?: string;
  contentMd: string;
  contentJson: StandupContent;
  eventIds: string[];
}

export interface DemoIntern {
  id: string;
  name: string;
  githubUsername: string;
  internshipStartDate: string;
  internshipEndDate: string;
  repos: RepoListItem[];
  events: ActivityEvent[];
}
