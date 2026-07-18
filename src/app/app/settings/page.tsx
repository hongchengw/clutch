import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pick repos, set internship dates, and refresh sync. Gracefully waits for
        Person A&apos;s APIs.
      </p>
      <div className="mt-6">
        <SettingsForm />
      </div>
    </div>
  );
}
