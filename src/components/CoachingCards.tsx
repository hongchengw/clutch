import type { CoachingCard } from "@/lib/coaching";

export function CoachingCards({ cards }: { cards: CoachingCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="panel p-5 text-sm text-[var(--muted)]">
        No coaching nudges for this range — keep shipping.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card, index) => (
        <article
          key={card.id}
          className="panel p-5"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <p className="tag tag-blue">Coach</p>
          <h3 className="mt-3 font-display text-xl font-medium text-[var(--ink-strong)]">
            {card.title}
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{card.body}</p>
        </article>
      ))}
    </div>
  );
}
