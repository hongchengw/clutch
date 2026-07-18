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
    <div className="panel rounded-[12px] p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--pale-blue-ink)]">
            Resume metrics · XYZ
          </p>
          <h3 className="mt-1 font-display text-2xl font-medium text-[var(--accent-blue)]">
            Copy-ready bullets
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Google format: Accomplished X as measured by Y, by doing Z.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[#f9f9f8] px-3 py-3"
          >
            <p className="text-sm leading-relaxed text-[var(--ink)]">{bullet}</p>
            <button
              type="button"
              onClick={() => copy(bullet)}
              className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--pale-blue-ink)] hover:border-[var(--pale-blue-ink)]"
            >
              {copied === bullet ? "Copied" : "Copy"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
