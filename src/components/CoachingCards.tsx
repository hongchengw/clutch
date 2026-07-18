import type { CoachingCard } from "@/lib/coaching";

export function CoachingCards({ cards }: { cards: CoachingCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="panel rounded-2xl p-5 text-sm text-[var(--mist)]">
        No coaching nudges for this range — keep shipping.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <article key={card.id} className="panel rounded-2xl p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">
            Coach
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold text-[var(--paper)]">
            {card.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--mist)]">
            {card.body}
          </p>
        </article>
      ))}
    </div>
  );
}
