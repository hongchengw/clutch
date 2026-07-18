import type { ActivityEvent, StandupBullet, StandupContent } from "@/lib/types";

function bulletHasReceipt(
  bullet: StandupBullet,
  eventsById: Map<string, ActivityEvent>,
): boolean {
  if (!bullet.eventId) return false;
  const event = eventsById.get(bullet.eventId);
  if (!event) return false;
  bullet.url = event.url;
  return true;
}

/** Strip bullets that invent work with no matching event id (SPEC §10). */
export function validateAndStripCitations(
  content: StandupContent,
  events: ActivityEvent[],
): { content: StandupContent; eventIds: string[] } {
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const cited = new Set<string>();

  const filter = (bullets: StandupBullet[], requireCitation: boolean) =>
    bullets.filter((b) => {
      if (!b.eventId) return !requireCitation;
      if (!bulletHasReceipt(b, eventsById)) return false;
      cited.add(b.eventId);
      return true;
    });

  const next: StandupContent = {
    whatIDid: filter(content.whatIDid, true),
    whatsNext: filter(content.whatsNext, false),
    blockers: filter(content.blockers, false),
    proofLinks: filter(content.proofLinks, true),
  };

  return { content: next, eventIds: [...cited] };
}
