export function DemoBanner() {
  return (
    <div className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--pale-yellow)] px-4 py-2 text-center text-sm text-[var(--pale-yellow-ink)]">
      <span className="font-semibold">Demo mode</span>
      {" — "}
      seeded intern data, no GitHub login required.{" "}
      <a href="/login" className="underline underline-offset-2">
        Connect your GitHub
      </a>{" "}
      when you&apos;re ready.
    </div>
  );
}
