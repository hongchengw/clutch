"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { patchStandup } from "@/lib/api";

export default function StandupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [contentMd, setContentMd] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const draft = window.localStorage.getItem("shiplog-standup-draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as { contentMd?: string };
        setContentMd(parsed.contentMd ?? "");
      } catch {
        setContentMd("");
      }
    }
  }, []);

  async function onSave() {
    const saved = await patchStandup(id, contentMd, {
      didYesterday: [],
      doingNext: [],
      blockers: [],
      proofLinks: [],
    });
    if (saved) {
      setStatus("Saved to API.");
    } else {
      window.localStorage.setItem(
        "shiplog-standup-draft",
        JSON.stringify({ contentMd }),
      );
      setStatus("API not ready — saved draft locally.");
    }
  }

  async function copyMd() {
    await navigator.clipboard.writeText(contentMd);
    setStatus("Copied Markdown.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--mist)]">
        Standup {id}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">Edit standup</h1>
      <textarea
        className="field mt-6 min-h-[420px] font-mono text-sm"
        value={contentMd}
        onChange={(e) => setContentMd(e.target.value)}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={onSave}>
          Save edits
        </button>
        <button type="button" className="btn-ghost" onClick={copyMd}>
          Copy Markdown
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-[var(--mist)]">{status}</p>}
    </div>
  );
}
