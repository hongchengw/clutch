"use client";

import { useMemo, useState } from "react";
import {
  generateTemplateStandup,
  standupToMarkdown,
} from "@/lib/ai/templateStandup";
import { validateAndStripCitations } from "@/lib/ai/validateCitations";
import { generateStandupApi } from "@/lib/api";
import { filterEventsByRange, resolveDateRange } from "@/lib/ranges";
import type {
  ActivityEvent,
  DateRangeKey,
  StandupContent,
  StandupLength,
  StandupTone,
} from "@/lib/types";

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "internship", label: "Full internship" },
  { key: "custom", label: "Custom" },
];

function localGenerate(
  events: ActivityEvent[],
  tone: StandupTone,
  length: StandupLength,
  highlightMode: boolean,
  rangeStart: string,
  rangeEnd: string,
) {
  const templated = generateTemplateStandup(events, {
    rangeStart,
    rangeEnd,
    tone,
    length,
    highlightMode,
  });
  const validated = validateAndStripCitations(templated.contentJson, events);
  return {
    contentMd: standupToMarkdown(validated.content),
    contentJson: validated.content,
    eventIds: validated.eventIds,
  };
}

export function StandupGenerator({
  events,
  internshipStart,
  internshipEnd,
  demo = false,
  storageKey = "shiplog-standup-draft",
}: {
  events: ActivityEvent[];
  internshipStart?: string;
  internshipEnd?: string;
  demo?: boolean;
  storageKey?: string;
}) {
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("last7");
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
      resolveDateRange(rangeKey, {
        customStart,
        customEnd,
        internshipStart,
        internshipEnd,
      }),
    [rangeKey, customStart, customEnd, internshipStart, internshipEnd],
  );

  const rangedEvents = useMemo(
    () => filterEventsByRange(events, range.start, range.end),
    [events, range.start, range.end],
  );

  async function onGenerate() {
    setBusy(true);
    setStatus(null);
    const rangeStart = range.start.toISOString();
    const rangeEnd = range.end.toISOString();

    try {
      if (!demo) {
        const apiResult = await generateStandupApi({
          rangeStart,
          rangeEnd,
          tone,
          length,
          highlightMode,
        });
        if (apiResult) {
          setContentMd(apiResult.contentMd);
          setContentJson(apiResult.contentJson);
          setStatus(
            apiResult.id
              ? `Saved as ${apiResult.id}`
              : "Generated via API (not persisted yet)",
          );
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              storageKey,
              JSON.stringify(apiResult),
            );
          }
          return;
        }
      }

      const local = localGenerate(
        rangedEvents,
        tone,
        length,
        highlightMode,
        rangeStart,
        rangeEnd,
      );
      setContentMd(local.contentMd);
      setContentJson(local.contentJson);
      setStatus(
        demo
          ? `Generated from ${rangedEvents.length} demo events (template engine)`
          : `API not ready yet — generated locally from ${rangedEvents.length} events`,
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(local));
      }
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
          <h2 className="mt-1 font-display text-2xl font-semibold">Make it review-ready</h2>
        </div>

        <label className="block text-sm text-[var(--mist)]">
          Range
          <select
            className="field mt-1"
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value as DateRangeKey)}
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
        {contentJson && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {contentJson.proofLinks.map((link) => (
              <a
                key={`${link.eventId}-${link.text}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--signal)] hover:border-[var(--signal)]"
              >
                {link.text}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
