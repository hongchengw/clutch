import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { DemoBanner } from "@/components/DemoBanner";
import { demoIntern } from "@/data/demo";

export default function DemoSettingsPage() {
  return (
    <main>
      <DemoBanner />
      <AppNav demo basePath="/demo" />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Settings (demo)</h1>
        <p className="mt-2 text-sm text-[var(--mist)]">
          Repo picker and sync are live on{" "}
          <Link href="/app/settings" className="text-[var(--signal)] underline">
            /app/settings
          </Link>{" "}
          after GitHub login. Demo repos are fixed seed data.
        </p>
        <ul className="panel mt-6 divide-y divide-[var(--line)] rounded-2xl">
          {demoIntern.repos.map((repo) => (
            <li
              key={repo.fullName}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="font-medium">{repo.fullName}</p>
                <p className="font-mono text-xs text-[var(--mist)]">
                  {repo.private ? "private" : "public"} · included
                </p>
              </div>
              <span className="text-[var(--signal)]">✓</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
