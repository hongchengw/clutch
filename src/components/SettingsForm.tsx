"use client";

import { useEffect, useState } from "react";
import { fetchRepos, saveRepoSelection, triggerSync } from "@/lib/api";
import type { RepoDTO } from "@/lib/types";

export function SettingsForm() {
  const [repos, setRepos] = useState<RepoDTO[]>([]);
  const [startDate, setStartDate] = useState("2026-05-26");
  const [endDate, setEndDate] = useState("2026-08-14");
  const [status, setStatus] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await fetchRepos();
      if (cancelled) return;
      if (list) {
        setRepos(list);
        setApiReady(true);
        const synced = list
          .map((r) => r.lastSyncedAt)
          .filter(Boolean)
          .sort()
          .at(-1);
        setLastSyncedAt(synced ?? null);
        setStatus(null);
      } else {
        setApiReady(false);
        setStatus(
          "Repo API not available yet (sign in + Person A /api/repos). Form stays ready.",
        );
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(fullName: string) {
    setRepos((prev) =>
      prev.map((r) =>
        r.fullName === fullName ? { ...r, included: !r.included } : r,
      ),
    );
  }

  async function onSave() {
    setSaving(true);
    const ok = await saveRepoSelection(repos);
    const included = repos.filter((r) => r.included).length;
    setStatus(
      ok
        ? `Saved ${included} included repos.`
        : "Could not save — sign in or wait for /api/repos/selection.",
    );
    setSaving(false);
  }

  async function onRefresh() {
    setSaving(true);
    const res = await triggerSync();
    if (res) {
      setLastSyncedAt(res.syncedAt);
      setStatus(`Sync finished for ${res.repos.length} repos.`);
    } else {
      setStatus("Could not sync — sign in or wait for /api/sync.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {status && (
        <p className="rounded-xl border border-[var(--line)] bg-black/20 px-4 py-3 text-sm text-[var(--mist)]">
          {status}
        </p>
      )}

      <section className="panel rounded-2xl p-5">
        <h2 className="font-display text-xl font-semibold">Internship dates</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[var(--mist)]">
            Start
            <input
              type="date"
              className="field mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="text-sm text-[var(--mist)]">
            End (optional)
            <input
              type="date"
              className="field mt-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Repos</h2>
            <p className="text-sm text-[var(--mist)]">
              {apiReady
                ? "Toggle which repos ShipLog should include."
                : "Waiting on GET /api/repos (after GitHub login)"}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost !py-2 !text-sm"
            onClick={onRefresh}
            disabled={saving}
          >
            Refresh now
          </button>
        </div>
        {lastSyncedAt && (
          <p className="mt-2 font-mono text-xs text-[var(--signal)]">
            Last synced {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
        <ul className="mt-4 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
          {repos.length === 0 && (
            <li className="px-4 py-3 text-sm text-[var(--mist)]">
              No repos loaded.
            </li>
          )}
          {repos.map((repo) => (
            <li key={repo.fullName} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={repo.included}
                onChange={() => toggle(repo.fullName)}
              />
              <div>
                <p className="font-medium">{repo.fullName}</p>
                <p className="font-mono text-xs text-[var(--mist)]">
                  {repo.private ? "private" : "public"}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={onSave}
          disabled={saving || !apiReady}
        >
          Save selection
        </button>
      </section>
    </div>
  );
}
