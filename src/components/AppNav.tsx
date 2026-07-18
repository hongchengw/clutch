import Link from "next/link";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/standups", label: "Standups" },
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
    <header className="border-b border-[var(--line)] bg-[rgba(12,18,32,0.8)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href={demo ? "/demo" : "/app"} className="font-display text-lg font-bold tracking-tight">
          Ship<span className="text-[var(--signal)]">Log</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm text-[var(--mist)]">
          {mapped.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-white/5 hover:text-[var(--fog)]"
            >
              {link.label}
            </Link>
          ))}
          {!demo && (
            <Link href="/demo" className="ml-1 rounded-full px-3 py-1.5 text-[var(--signal)]">
              Demo
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
