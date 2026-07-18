export function DemoBanner() {
  return (
    <div className="sticky top-0 z-40 border-b border-[rgba(255,122,60,0.35)] bg-[rgba(255,122,60,0.12)] px-4 py-2 text-center text-sm text-[#ffd2b8] backdrop-blur-md">
      <span className="font-semibold text-[#ffb089]">Demo mode</span>
      {" — "}
      seeded intern data, no GitHub login required.{" "}
      <a href="/login" className="underline decoration-[#ff7a3c]/40 underline-offset-2">
        Connect your GitHub
      </a>{" "}
      when you&apos;re ready.
    </div>
  );
}
