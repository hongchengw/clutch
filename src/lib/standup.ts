import type {
  ActivityEventDTO,
  StandupContent,
  StandupLength,
  StandupSectionBullet,
  StandupTone,
} from "./types";

// Template-based standup generator (A5, SPEC §7.4). This is the
// no-API-key fallback and the grounding baseline: every bullet cites
// the ActivityEvent ids it came from (SPEC §4/§10 — receipts, not
// fiction). Person B's AI generator (B5) layers on top and must pass
// the same validateGrounding gate.

export interface GenerateOptions {
  tone: StandupTone;
  length: StandupLength;
  highlightMode?: boolean;
}

export interface GeneratedStandup {
  contentMd: string;
  contentJson: StandupContent;
  eventIds: string[];
}

function bullet(text: string, ev: ActivityEventDTO): StandupSectionBullet {
  return { text, eventIds: [ev.id], url: ev.url };
}

function sizeNote(ev: ActivityEventDTO): string {
  if (ev.additions === null && ev.deletions === null) return "";
  return ` (+${ev.additions ?? 0}/−${ev.deletions ?? 0})`;
}

function buildDidBullets(
  events: ActivityEventDTO[],
  opts: GenerateOptions
): StandupSectionBullet[] {
  const merged = events.filter((e) => e.type === "pr_merged");
  const reviews = events.filter((e) => e.type === "review");
  const commits = events.filter((e) => e.type === "commit");
  const closed = events.filter((e) => e.type === "issue_closed");

  const did: StandupSectionBullet[] = [];
  for (const pr of merged) {
    did.push(
      bullet(
        `Merged "${pr.title}" in ${pr.repoFullName}${sizeNote(pr)}`,
        pr
      )
    );
  }
  for (const r of reviews) {
    did.push(bullet(`${r.title} in ${r.repoFullName}`, r));
  }
  const commitCap = opts.length === "short" ? 3 : opts.length === "standard" ? 6 : Infinity;
  for (const c of commits.slice(0, commitCap)) {
    did.push(bullet(`Committed "${c.title}" to ${c.repoFullName}`, c));
  }
  for (const i of closed) {
    did.push(bullet(`Closed issue "${i.title}" in ${i.repoFullName}`, i));
  }

  // Non-highlight mode keeps chronological-ish template order too, but
  // highlight mode guarantees merged PRs lead (SPEC §7.4).
  if (opts.highlightMode) {
    did.sort((a, b) => {
      const rank = (x: StandupSectionBullet) =>
        x.text.startsWith("Merged") ? 0 : 1;
      return rank(a) - rank(b);
    });
  }
  return did;
}

function buildNextBullets(events: ActivityEventDTO[]): StandupSectionBullet[] {
  // PRs opened in range that never merged/closed in range are still in flight.
  const settled = new Set(
    events
      .filter((e) => e.type === "pr_merged" || e.type === "pr_closed")
      .map((e) => e.title)
  );
  return events
    .filter((e) => e.type === "pr_opened" && !settled.has(e.title))
    .map((pr) => bullet(`Land "${pr.title}" (${pr.repoFullName})`, pr));
}

function renderMarkdown(content: StandupContent, opts: GenerateOptions): string {
  const lines: string[] = [];
  const heading =
    opts.tone === "resume" ? "## Highlights" : "## What I did";
  lines.push(heading);
  if (content.didYesterday.length === 0) {
    lines.push("- No tracked activity in this range.");
  }
  for (const b of content.didYesterday) {
    lines.push(b.url ? `- ${b.text} — [link](${b.url})` : `- ${b.text}`);
  }
  lines.push("", "## What's next");
  if (content.doingNext.length === 0) lines.push("- _(add your plan here)_");
  for (const b of content.doingNext) {
    lines.push(b.url ? `- ${b.text} — [link](${b.url})` : `- ${b.text}`);
  }
  lines.push("", "## Blockers");
  if (content.blockers.length === 0) lines.push("- None right now.");
  for (const b of content.blockers) lines.push(`- ${b.text}`);
  if (content.proofLinks.length > 0) {
    lines.push("", "## Proof");
    for (const p of content.proofLinks) lines.push(`- [${p.label}](${p.url})`);
  }
  return lines.join("\n");
}

/**
 * SPEC §10 post-validation: drop any did/next bullet whose citations
 * aren't all real event ids. Blockers are user-editable free text and
 * are intentionally exempt.
 */
export function validateGrounding(
  content: StandupContent,
  validIds: Set<string>
): StandupContent {
  const grounded = (bullets: StandupSectionBullet[]) =>
    bullets.filter(
      (b) => b.eventIds.length > 0 && b.eventIds.every((id) => validIds.has(id))
    );
  return {
    didYesterday: grounded(content.didYesterday),
    doingNext: grounded(content.doingNext),
    blockers: content.blockers,
    proofLinks: content.proofLinks,
  };
}

export function generateStandup(
  events: ActivityEventDTO[],
  opts: GenerateOptions
): GeneratedStandup {
  const raw: StandupContent = {
    didYesterday: buildDidBullets(events, opts),
    doingNext: buildNextBullets(events),
    blockers: [],
    proofLinks: events
      .filter((e) => e.type === "pr_merged" || e.type === "review")
      .map((e) => ({ label: `${e.repoFullName}: ${e.title}`, url: e.url })),
  };

  const validIds = new Set(events.map((e) => e.id));
  const contentJson = validateGrounding(raw, validIds);

  const eventIds = [
    ...new Set(
      [...contentJson.didYesterday, ...contentJson.doingNext].flatMap(
        (b) => b.eventIds
      )
    ),
  ];

  return {
    contentMd: renderMarkdown(contentJson, opts),
    contentJson,
    eventIds,
  };
}
