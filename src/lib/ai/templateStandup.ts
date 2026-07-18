import type {
  ActivityEvent,
  GenerateStandupRequest,
  StandupContent,
  StandupLength,
} from "@/lib/types";

function bulletLimit(length: StandupLength): number {
  if (length === "short") return 3;
  if (length === "detailed") return 8;
  return 5;
}

function phraseForEvent(
  event: ActivityEvent,
  tone: GenerateStandupRequest["tone"],
  highlightMode: boolean,
): string {
  const repo = event.repoFullName ? ` in ${event.repoFullName}` : "";
  const impact =
    highlightMode && event.type === "pr_merged"
      ? " (merged — ready for review packet)"
      : "";

  if (tone === "resume") {
    switch (event.type) {
      case "pr_merged":
        return `Shipped “${event.title}”${repo}${impact}`;
      case "pr_opened":
        return `Opened pull request “${event.title}”${repo}`;
      case "review":
        return `Reviewed teammate work: “${event.title}”${repo}`;
      case "commit":
        return `Delivered commit “${event.title}”${repo}`;
      default:
        return `Contributed “${event.title}”${repo}`;
    }
  }

  if (tone === "professional") {
    switch (event.type) {
      case "pr_merged":
        return `Merged ${event.title}${repo}${impact}.`;
      case "pr_opened":
        return `Opened ${event.title}${repo} and is awaiting review.`;
      case "review":
        return `Completed code review: ${event.title}${repo}.`;
      case "commit":
        return `Committed progress on ${event.title}${repo}.`;
      default:
        return `Worked on ${event.title}${repo}.`;
    }
  }

  // casual standup
  switch (event.type) {
    case "pr_merged":
      return `Landed ${event.title}${repo}${impact}`;
    case "pr_opened":
      return `Opened ${event.title}${repo}`;
    case "review":
      return `Reviewed ${event.title}${repo}`;
    case "commit":
      return `Pushed ${event.title}${repo}`;
    case "issue_opened":
      return `Filed ${event.title}${repo}`;
    default:
      return `Touched ${event.title}${repo}`;
  }
}

function rankEvents(
  events: ActivityEvent[],
  highlightMode: boolean,
): ActivityEvent[] {
  const weight = (e: ActivityEvent) => {
    let w = 0;
    if (e.type === "pr_merged") w += highlightMode ? 50 : 40;
    else if (e.type === "pr_opened") w += 25;
    else if (e.type === "review") w += 20;
    else if (e.type === "commit") w += 10;
    else w += 5;
    w += Math.min(30, ((e.additions ?? 0) + (e.deletions ?? 0)) / 20);
    return w;
  };
  return [...events].sort((a, b) => weight(b) - weight(a));
}

/** Template-only standup generator — works with zero AI API key. */
export function generateTemplateStandup(
  events: ActivityEvent[],
  req: GenerateStandupRequest,
): { contentJson: StandupContent; eventIds: string[] } {
  const limit = bulletLimit(req.length);
  const ranked = rankEvents(events, Boolean(req.highlightMode)).slice(0, limit);

  const whatIDid = ranked.map((event) => ({
    text: phraseForEvent(event, req.tone, Boolean(req.highlightMode)),
    eventId: event.id,
    url: event.url,
  }));

  const openPrs = events.filter((e) => e.type === "pr_opened").slice(0, 2);
  const whatsNext =
    openPrs.length > 0
      ? openPrs.map((event) => ({
          text:
            req.tone === "casual"
              ? `Keep pushing ${event.title}`
              : `Continue progress on ${event.title}`,
          eventId: event.id,
          url: event.url,
        }))
      : [
          {
            text:
              req.tone === "resume"
                ? "Identify the next high-impact pull request from open issues"
                : "Pick the next small PR from open issues / review queue",
          },
        ];

  const huge = events.find(
    (e) => (e.additions ?? 0) + (e.deletions ?? 0) > 500,
  );
  const blockers = huge
    ? [
        {
          text:
            req.tone === "casual"
              ? `Watching a large PR — may need a split: ${huge.title}`
              : `Potential blocker: large change set on ${huge.title} may slow review.`,
          eventId: huge.id,
          url: huge.url,
        },
      ]
    : [
        {
          text:
            req.tone === "casual"
              ? "No blockers from git signals — add any manually"
              : "No blockers detected from activity signals.",
        },
      ];

  const proofLinks = ranked.map((event) => ({
    text: event.title,
    eventId: event.id,
    url: event.url,
  }));

  return {
    contentJson: { whatIDid, whatsNext, blockers, proofLinks },
    eventIds: ranked.map((e) => e.id),
  };
}

export function standupToMarkdown(content: StandupContent): string {
  const section = (title: string, bullets: StandupContent["whatIDid"]) => {
    const lines =
      bullets.length === 0
        ? ["- _(empty)_"]
        : bullets.map((b) =>
            b.url ? `- ${b.text} — [proof](${b.url})` : `- ${b.text}`,
          );
    return `## ${title}\n${lines.join("\n")}`;
  };

  return [
    section("What I did", content.whatIDid),
    section("What I'm doing next", content.whatsNext),
    section("Blockers", content.blockers),
    section("Proof links", content.proofLinks),
  ].join("\n\n");
}
