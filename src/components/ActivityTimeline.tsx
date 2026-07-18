import type { ActivityEvent } from "@/lib/types";

const typeLabel: Record<ActivityEvent["type"], string> = {
  commit: "Commit",
  pr_opened: "PR opened",
  pr_merged: "PR merged",
  pr_closed: "PR closed",
  review: "Review",
  issue_opened: "Issue",
  issue_closed: "Issue closed",
  comment: "Comment",
};

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="panel rounded-2xl p-5 text-sm text-[var(--mist)]">
        No activity in this range yet.
      </div>
    );
  }

  return (
    <ol className="panel divide-y divide-[var(--line)] rounded-2xl">
      {events.slice(0, 20).map((event) => (
        <li key={event.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--mist)]">
              {typeLabel[event.type]}
              {event.repoFullName ? ` · ${event.repoFullName}` : ""}
            </p>
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block font-medium text-[var(--paper)] hover:text-[var(--signal)]"
            >
              {event.title}
            </a>
          </div>
          <time className="shrink-0 font-mono text-xs text-[var(--mist)]">
            {new Date(event.occurredAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </time>
        </li>
      ))}
    </ol>
  );
}
