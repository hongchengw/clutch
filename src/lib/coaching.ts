import type { ActivityEventDTO, MetricsDTO } from "@/lib/types";

export interface CoachingCard {
  id: string;
  title: string;
  body: string;
}

/** Friendly coaching heuristics from SPEC §7.8 (not scores). */
export function buildCoachingCards(
  events: ActivityEventDTO[],
  metrics: MetricsDTO,
): CoachingCard[] {
  const cards: CoachingCard[] = [];

  if (
    metrics.reviewsGiven < 3 &&
    metrics.prsMerged + metrics.prsOpened >= 2
  ) {
    cards.push({
      id: "few-reviews",
      title: "Review a teammate this week",
      body: "You’ve shipped PRs, but only a few reviews show up. One thoughtful review often counts as much as another commit for return-offer season.",
    });
  }

  const prs = events.filter(
    (e) => e.type === "pr_opened" || e.type === "pr_merged",
  );
  if (prs.length > 0) {
    const avgSize =
      prs.reduce(
        (sum, e) => sum + (e.additions ?? 0) + (e.deletions ?? 0),
        0,
      ) / prs.length;
    if (avgSize > 400) {
      cards.push({
        id: "huge-prs",
        title: "Shrink the blast radius",
        body: "Average PR size is chunky. Smaller, reviewable slices merge faster and look sharper in a manager brief.",
      });
    }
  }

  if (metrics.consistency < 0.45 && metrics.commits + metrics.prsOpened > 0) {
    cards.push({
      id: "gaps",
      title: "Keep a light daily pulse",
      body: "There are quiet stretches in this range. Even a small commit, review, or issue update keeps the story continuous.",
    });
  }

  const drafts = events.filter((e) => e.type === "pr_opened");
  const mergedTitles = new Set(
    events
      .filter((e) => e.type === "pr_merged")
      .map((e) => e.title.toLowerCase().slice(0, 24)),
  );
  const staleDrafts = drafts.filter(
    (d) => !mergedTitles.has(d.title.toLowerCase().slice(0, 24)),
  );
  if (staleDrafts.length >= 1) {
    cards.push({
      id: "stale-drafts",
      title: "Close the loop on open PRs",
      body: "You have opened PRs that haven’t landed yet. Finish, split, or close them so your summer pack stays tidy.",
    });
  }

  if (metrics.commits >= 6 && metrics.prsOpened + metrics.prsMerged <= 2) {
    cards.push({
      id: "commit-pr-ratio",
      title: "Open the PR earlier",
      body: "Lots of commits, fewer PRs. Opening a draft sooner gives you review signal and clearer proof links.",
    });
  }

  return cards.slice(0, 4);
}
