"use client";

import { useMemo, useState } from "react";
import { generateStandupApi } from "@/lib/api";
import { generateStandup } from "@/lib/standup";
import { filterEventsByRange, resolveUiRange } from "@/lib/ui-helpers";
import type {
  ActivityEventDTO,
  StandupContent,
  StandupLength,
  StandupRangePreset,
  StandupTone,
} from "@/lib/types";

const RANGES: { key: StandupRangePreset; label: string }[] = [
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "internship", label: "Full internship" },
  { key: "custom", label: "Custom" },
];

export function StandupGenerator({
  events,
  internshipStart,
  demo = false,
  storageKey = "shiplog-standup-draft",
}: {
  events: ActivityEventDTO[];
  internshipStart?: string;
  demo?: boolean;
  storageKey?: string;
}) {
  const [rangeKey, setRangeKey] = useState<StandupRangePreset>("last7");
  const [customStart, setCustomStart] = useState("2026-07-01");
  const [customEnd, setCustomEnd] = useState("2026-07-18");
  const [tone, setTone] = useState<StandupTone>("casual");
  const [length, setLength] = useState<StandupLength>("standard");
  const [highlightMode, setHighlightMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentMd, setContentMd] = useState("");
  const [contentJson, setContentJson] = useState<StandupContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const range = useMemo(
    () =>
      resolveUiRange(rangeKey, {
        customStart,
        customEnd,
        internshipStart,
      }),
    [rangeKey, customStart, customEnd, internshipStart],
  );

  const rangedEvents = useMemo(
    () => filterEventsByRange(events, range.start, range.end),
    [events, range.start, range.end],
  );

  async function onGenerate() {
    setBusy(true);
    setStatus(null);

    try {
      if (!demo) {
        const apiResult = await generateStandupApi({
          preset: rangeKey,
          start: rangeKey === "custom" ? range.start.toISOString() : undefined,
          end: rangeKey === "custom" ? range.end.toISOString() : undefined,
          tone,
          length,
          highlightMode,
        });
        if (apiResult) {
          setContentMd(apiResult.contentMd);
          setContentJson(apiResult.contentJson);
          setStatus(`Saved standup ${apiResult.id}`);
          window.localStorage.setItem(storageKey, JSON.stringify(apiResult));
          return;
        }
      }

      const local = generateStandup(rangedEvents, {
        tone,
        length,
        highlightMode,
      });
      setContentMd(local.contentMd);
      setContentJson(local.contentJson);
      setStatus(
        demo
          ? `Generated from ${rangedEvents.length} demo events (Person A template engine)`
          : `API not ready/authorized — generated locally from ${rangedEvents.length} events`,
      );
      window.localStorage.setItem(storageKey, JSON.stringify(local));
    } finally {
      setBusy(false);
    }
  }

  async function copyMarkdown() {
    if (!contentMd) return;
    await navigator.clipboard.writeText(contentMd);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="panel space-y-4 rounded-2xl p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">
            Generate standup
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Make it review-ready
          </h2>
        </div>

        <label className="block text-sm text-[var(--mist)]">
          Range
          <select
            className="field mt-1"
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value as StandupRangePreset)}
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {rangeKey === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm text-[var(--mist)]">
              Start
              <input
                type="date"
                className="field mt-1"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </label>
            <label className="block text-sm text-[var(--mist)]">
              End
              <input
                type="date"
                className="field mt-1"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </label>
          </div>
        )}

        <label className="block text-sm text-[var(--mist)]">
          Tone
          <select
            className="field mt-1"
            value={tone}
            onChange={(e) => setTone(e.target.value as StandupTone)}
          >
            <option value="casual">Casual standup</option>
            <option value="professional">Professional review</option>
            <option value="resume">Resume bullets</option>
          </select>
        </label>

        <label className="block text-sm text-[var(--mist)]">
          Length
          <select
            className="field mt-1"
            value={length}
            onChange={(e) => setLength(e.target.value as StandupLength)}
          >
            <option value="short">Short</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-[var(--fog)]">
          <input
            type="checkbox"
            checked={highlightMode}
            onChange={(e) => setHighlightMode(e.target.checked)}
          />
          Highlight merged PRs & impact (still truthful)
        </label>

        <p className="text-xs text-[var(--mist)]">
          {range.label}: {rangedEvents.length} events
        </p>

        <button
          type="button"
          className="btn-primary anim-glow w-full"
          onClick={onGenerate}
          disabled={busy}
        >
          {busy ? "Generating…" : "Generate standup"}
        </button>
        {status && <p className="text-xs text-[var(--mist)]">{status}</p>}
      </aside>

      <section className="panel rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-semibold">Editor</h3>
          <button
            type="button"
            className="btn-ghost !py-2 !text-sm"
            onClick={copyMarkdown}
            disabled={!contentMd}
          >
            {copied ? "Copied Markdown" : "Copy Markdown"}
          </button>
        </div>
        <textarea
          className="field min-h-[420px] font-mono text-sm leading-relaxed"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          placeholder="Hit Generate standup — every claim should keep a proof link."
        />
        {contentJson && contentJson.proofLinks.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {contentJson.proofLinks.map((link) => (
              <a
                key={`${link.url}-${link.label}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--signal)] hover:border-[var(--signal)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
