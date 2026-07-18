"use client";

import { useEffect, useState } from "react";
import {
  createInvite,
  listInvites,
  managerSharePath,
  type ManagerInviteRecord,
} from "@/lib/manager-share";

export function InviteManagerForm({ demo = false }: { demo?: boolean }) {
  const [note, setNote] = useState("");
  const [invites, setInvites] = useState<ManagerInviteRecord[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setInvites(listInvites());
  }, []);

  function onCreate() {
    const invite = createInvite(note);
    setInvites(listInvites());
    setNote("");
    void copyLink(invite.token);
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}${managerSharePath(token)}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="tag tag-blue">Manager invite</p>
        <h1 className="mt-3 font-display text-3xl font-medium text-[var(--ink-strong)]">
          Invite someone to review your work
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Create a share link. Your manager sees consistency, reviews given, and
          top PRs — no GitHub login required.
          {demo ? " Demo links use seed data stored in this browser." : ""}
        </p>

        <label className="mt-6 block text-sm text-[var(--muted)]">
          Optional note for your manager
          <textarea
            className="field mt-2 min-h-[96px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hey — here’s my summer contribution brief before our 1:1."
          />
        </label>

        <button type="button" className="btn-primary mt-4" onClick={onCreate}>
          Create invite link
        </button>
      </section>

      <section className="panel p-6">
        <h2 className="font-display text-2xl font-medium text-[var(--ink-strong)]">
          Your invites
        </h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            No invites yet. Create one above.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)] rounded-[8px] border border-[var(--line)]">
            {invites.map((invite) => (
              <li
                key={invite.token}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs text-[var(--muted)]">
                    {managerSharePath(invite.token)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink)]">
                    Created{" "}
                    {new Date(invite.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {invite.note && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {invite.note}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <a
                    href={managerSharePath(invite.token)}
                    className="btn-ghost !py-2 !text-sm"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    className="btn-primary !py-2 !text-sm"
                    onClick={() => copyLink(invite.token)}
                  >
                    {copied === invite.token ? "Copied" : "Copy link"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
