"use client";

import { useEffect, useState } from "react";
import { DashboardView } from "@/components/DashboardView";
import { demoIntern } from "@/data/demo";
import { fetchActivity } from "@/lib/api";
import { resolveUiRange } from "@/lib/ui-helpers";
import type { ActivityEventDTO } from "@/lib/types";

export function AppDashboard() {
  const [events, setEvents] = useState<ActivityEventDTO[] | null>(null);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const intern = resolveUiRange("internship", {
        internshipStart: demoIntern.internshipStartDate,
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
          Live activity API not available yet — showing seed data. Auto-switches
          when authenticated sync data is present.
        </div>
      )}
      <DashboardView
        events={events}
        internshipStart={demoIntern.internshipStartDate}
        demo={source === "fallback"}
      />
    </>
  );
}
