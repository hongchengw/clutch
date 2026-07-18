import Link from "next/link";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/standups", label: "Standups" },
  { href: "/app/invite", label: "Invite" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav({
  demo = false,
  basePath = "/app",
}: {
  demo?: boolean;
  basePath?: string;
}) {
  const mapped = links.map((l) => ({
    ...l,
    href: demo ? l.href.replace("/app", basePath) : l.href,
  }));

  return (
    <header className="border-b border-[var(--line)] bg-[rgba(251,251,250,0.88)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href={demo ? "/demo" : "/app"}
          className="font-display text-xl font-semibold text-[var(--ink-strong)]"
        >
          Clutch
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm text-[var(--muted)]">
          {mapped.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[6px] px-3 py-1.5 transition hover:bg-black/[0.03] hover:text-[var(--ink-strong)]"
            >
              {link.label}
            </Link>
          ))}
          {!demo && (
            <Link
              href="/demo"
              className="ml-1 rounded-[6px] px-3 py-1.5 text-[var(--pale-blue-ink)]"
            >
              Demo
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
