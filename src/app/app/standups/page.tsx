"use client";

import { useEffect, useState } from "react";
import { StandupGenerator } from "@/components/StandupGenerator";
import { demoIntern } from "@/data/demo";
import { fetchActivity } from "@/lib/api";
import { resolveUiRange } from "@/lib/ui-helpers";
import type { ActivityEventDTO } from "@/lib/types";

export default function StandupsPage() {
  const [events, setEvents] = useState<ActivityEventDTO[]>(demoIntern.events);
  const [demo, setDemo] = useState(true);

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
        setDemo(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Standups</h1>
      <p className="mt-2 text-sm text-[var(--mist)]">
        Generate for yesterday or full internship. Edits always win over AI.
        {demo
          ? " Using local template generation until authenticated APIs return data."
          : " Wired to live activity data."}
      </p>
      <div className="mt-6">
        <StandupGenerator
          events={events}
          demo={demo}
          internshipStart={demoIntern.internshipStartDate}
        />
      </div>
    </div>
  );
}
