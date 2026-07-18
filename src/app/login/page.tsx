import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <p className="font-display text-2xl font-semibold text-[var(--ink-strong)]">
        Clutch
      </p>
      <h1 className="mt-6 font-display text-4xl font-medium text-[var(--ink-strong)]">
        Connect GitHub
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        Sign in to sync your real repos. For a walkthrough without credentials,
        use demo mode.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/api/auth/signin" className="btn-primary text-center">
          Continue with GitHub
        </Link>
        <Link href="/demo" className="btn-ghost text-center">
          Try demo instead
        </Link>
        <Link
          href="/"
          className="text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
