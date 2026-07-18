import type { StandupContent, StandupDocDTO } from "./types";

// Prisma StandupDoc row -> shared DTO (structural to stay test-friendly).
export interface StandupDocRow {
  id: string;
  rangeStart: Date;
  rangeEnd: Date;
  tone: string;
  length: string;
  contentMd: string;
  contentJson: unknown;
  eventIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function toStandupDTO(doc: StandupDocRow): StandupDocDTO {
  return {
    id: doc.id,
    rangeStart: doc.rangeStart.toISOString(),
    rangeEnd: doc.rangeEnd.toISOString(),
    tone: doc.tone as StandupDocDTO["tone"],
    length: doc.length as StandupDocDTO["length"],
    contentMd: doc.contentMd,
    contentJson: (doc.contentJson as StandupContent | null) ?? null,
    eventIds: doc.eventIds,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
