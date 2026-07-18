import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <p className="font-display text-2xl font-bold">
        Ship<span className="text-[var(--signal)]">Log</span>
      </p>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">
        Connect GitHub
      </h1>
      <p className="mt-3 text-[var(--mist)]">
        OAuth is owned by Person A&apos;s platform track. When{" "}
        <code className="font-mono text-[var(--signal)]">/api/auth/signin</code>{" "}
        lands, this button will start the real flow. Until then, use demo mode.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <a href="/api/auth/signin/github" className="btn-primary text-center">
          Continue with GitHub
        </a>
        <Link href="/demo" className="btn-ghost text-center">
          Try demo instead
        </Link>
        <Link href="/" className="text-center text-sm text-[var(--mist)] hover:text-[var(--fog)]">
          ← Back to landing
        </Link>
      </div>
    </main>
  );
}
