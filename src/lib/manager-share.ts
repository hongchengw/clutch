import { demoIntern } from "@/data/demo";
import {
  computeStreak,
  metricsFromEvents,
  resolveUiRange,
  topPullRequests,
} from "@/lib/ui-helpers";
import type { ActivityEventDTO, MetricsDTO } from "@/lib/types";

const STORAGE_KEY = "clutch-manager-invites";

export interface ManagerInviteRecord {
  token: string;
  internName: string;
  githubUsername: string;
  createdAt: string;
  note?: string;
}

export interface ManagerBrief {
  invite: ManagerInviteRecord;
  metrics: MetricsDTO;
  streak: number;
  topPrs: ActivityEventDTO[];
  recentReviews: ActivityEventDTO[];
  rangeLabel: string;
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 22);
  }
  return `clutch${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function listInvites(): ManagerInviteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ManagerInviteRecord[];
  } catch {
    return [];
  }
}

function saveInvites(invites: ManagerInviteRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invites));
}

export function createInvite(note?: string): ManagerInviteRecord {
  const invite: ManagerInviteRecord = {
    token: randomToken(),
    internName: demoIntern.name,
    githubUsername: demoIntern.githubUsername,
    createdAt: new Date().toISOString(),
    note: note?.trim() || undefined,
  };
  const next = [invite, ...listInvites()].slice(0, 20);
  saveInvites(next);
  return invite;
}

export function getInvite(token: string): ManagerInviteRecord | null {
  return listInvites().find((i) => i.token === token) ?? null;
}

/** Demo brief for a manager share link (offline-capable). */
export function buildManagerBrief(
  invite: ManagerInviteRecord,
): ManagerBrief {
  const range = resolveUiRange("internship", {
    internshipStart: demoIntern.internshipStartDate,
  });
  const events = demoIntern.events.filter((e) => {
    const t = new Date(e.occurredAt).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  });
  const metrics = metricsFromEvents(events, range.start, range.end);
  return {
    invite,
    metrics,
    streak: computeStreak(events, range.start, range.end),
    topPrs: topPullRequests(events, 5),
    recentReviews: events.filter((e) => e.type === "review").slice(0, 5),
    rangeLabel: range.label,
  };
}

export function managerSharePath(token: string): string {
  return `/m/${token}`;
}
