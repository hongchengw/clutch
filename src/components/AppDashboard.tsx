"use client";

import { useEffect, useState } from "react";
import { DashboardView } from "@/components/DashboardView";
import { demoIntern } from "@/data/demo";
import { fetchActivity } from "@/lib/api";
import { resolveDateRange } from "@/lib/ranges";
import type { ActivityEvent } from "@/lib/types";

/**
 * Real /app dashboard: prefers Person A's /api/activity.
 * Falls back to labeled demo data so the UI never crashes if APIs aren't merged yet.
 */
export function AppDashboard() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const intern = resolveDateRange("internship", {
        internshipStart: demoIntern.internshipStartDate,
        internshipEnd: demoIntern.internshipEndDate,
      });
      const apiEvents = await fetchActivity(
        intern.start.toISOString(),
        intern.end.toISOString(),
      );
      if (cancelled) return;
      if (apiEvents && apiEvents.length > 0) {
        setEvents(apiEvents);
        setSource("api");
      } else {
        setEvents(demoIntern.events);
        setSource("fallback");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !events) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-[var(--mist)]">
        Loading dashboard…
      </div>
    );
  }

  return (
    <>
      {source === "fallback" && (
        <div className="border-b border-[var(--line)] bg-[rgba(46,230,166,0.08)] px-4 py-2 text-center text-sm text-[var(--mist)]">
          Live activity API not available yet — showing seed data so UI work can
          continue. Will auto-switch when Person A&apos;s{" "}
          <code className="font-mono text-[var(--signal)]">/api/activity</code>{" "}
          lands.
        </div>
      )}
      <DashboardView
        events={events}
        internshipStart={demoIntern.internshipStartDate}
        internshipEnd={demoIntern.internshipEndDate}
        demo={source === "fallback"}
      />
    </>
  );
}
