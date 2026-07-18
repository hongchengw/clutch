import { z } from "zod";
import { prisma } from "./prisma";
import type { ActivityEventDTO } from "./types";

// Shared query + DTO mapping for /api/activity, /api/metrics, and the
// standup generator (A4/A5).

export const rangeQuerySchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

export type StoredEventWithRepo = {
  id: string;
  repoId: string;
  provider: string;
  externalId: string;
  type: string;
  title: string;
  summary: string | null;
  url: string;
  additions: number | null;
  deletions: number | null;
  filesChanged: number | null;
  occurredAt: Date;
  repo: { fullName: string };
};

export function toEventDTO(e: StoredEventWithRepo): ActivityEventDTO {
  return {
    id: e.id,
    repoId: e.repoId,
    repoFullName: e.repo.fullName,
    provider: e.provider as ActivityEventDTO["provider"],
    externalId: e.externalId,
    type: e.type as ActivityEventDTO["type"],
    title: e.title,
    summary: e.summary,
    url: e.url,
    additions: e.additions,
    deletions: e.deletions,
    filesChanged: e.filesChanged,
    occurredAt: e.occurredAt.toISOString(),
  };
}

export async function fetchEventsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<StoredEventWithRepo[]> {
  return prisma.activityEvent.findMany({
    where: { userId, occurredAt: { gte: start, lte: end } },
    orderBy: { occurredAt: "desc" },
    include: { repo: { select: { fullName: true } } },
  });
}
