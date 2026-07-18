"use client";

import { useEffect, useState } from "react";
import {
  buildManagerBrief,
  getInvite,
  type ManagerBrief,
} from "@/lib/manager-share";

export function ManagerBriefView({ token }: { token: string }) {
  const [brief, setBrief] = useState<ManagerBrief | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const invite = getInvite(token);
    if (!invite) {
      // Fallback demo invite so shared/demo URLs still render a brief.
      const fallback = {
        token,
        internName: "Maya Chen",
        githubUsername: "maya-builds",
        createdAt: new Date().toISOString(),
        note: "Demo manager brief — create a real invite from /demo/invite.",
      };
      setBrief(buildManagerBrief(fallback));
      setMissing(true);
      return;
    }
    setBrief(buildManagerBrief(invite));
    setMissing(false);
  }, [token]);

  if (!brief) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-[var(--muted)]">
        Loading brief…
      </div>
    );
  }

  const { invite, metrics, streak, topPrs, recentReviews, rangeLabel } = brief;

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <p className="font-display text-xl font-semibold text-[var(--ink-strong)]">
            Clutch
          </p>
          <span className="tag tag-green">Manager view</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        {missing && (
          <p className="rounded-[8px] border border-[var(--line)] bg-[var(--pale-yellow)] px-4 py-3 text-sm text-[var(--pale-yellow-ink)]">
            This link wasn&apos;t found in this browser&apos;s saved invites —
            showing the demo brief so you can still preview the manager
            experience.
          </p>
        )}

        <section className="anim-rise">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Shared contribution brief · {rangeLabel}
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium text-[var(--ink-strong)]">
            {invite.internName}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            @{invite.githubUsername}
            {invite.note ? ` — ${invite.note}` : ""}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          {[
            {
              label: "Consistency",
              value: `${Math.round(metrics.consistency * 100)}%`,
              hint: "Active working days",
            },
            {
              label: "Reviews given",
              value: String(metrics.reviewsGiven),
              hint: "Teammate PR reviews",
            },
            {
              label: "PRs merged",
              value: String(metrics.prsMerged),
              hint: "Shipped pull requests",
            },
            {
              label: "Streak",
              value: `${streak}d`,
              hint: "Recent active days",
            },
          ].map((stat) => (
            <div key={stat.label} className="panel p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-3xl text-[var(--ink-strong)]">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{stat.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-5">
            <h2 className="font-display text-2xl font-medium text-[var(--ink-strong)]">
              Review performance
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Recent code reviews with proof links.
            </p>
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {recentReviews.length === 0 && (
                <li className="py-3 text-sm text-[var(--muted)]">
                  No reviews in this range.
                </li>
              )}
              {recentReviews.map((review) => (
                <li key={review.id} className="py-3">
                  <a
                    href={review.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--ink-strong)] hover:underline"
                  >
                    {review.title}
                  </a>
                  <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                    {review.repoFullName}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-2xl font-medium text-[var(--ink-strong)]">
              Top contributions
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Highest-impact PRs in range.
            </p>
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {topPrs.map((pr) => (
                <li key={pr.id} className="py-3">
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--ink-strong)] hover:underline"
                  >
                    {pr.title}
                  </a>
                  <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                    +{pr.additions ?? 0} / -{pr.deletions ?? 0} ·{" "}
                    {pr.repoFullName}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-center text-xs text-[var(--muted)]">
          Shared via Clutch · receipts only, no invented work
        </p>
      </div>
    </main>
  );
}
