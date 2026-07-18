"use client";

import { useState } from "react";

export function ResumeMetrics({ bullets }: { bullets: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ember)]">
            Resume metrics
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold">Copy-ready bullets</h3>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-black/20 px-3 py-3"
          >
            <p className="text-sm leading-relaxed text-[var(--fog)]">{bullet}</p>
            <button
              type="button"
              onClick={() => copy(bullet)}
              className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--signal)] hover:border-[var(--signal)]"
            >
              {copied === bullet ? "Copied" : "Copy"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
