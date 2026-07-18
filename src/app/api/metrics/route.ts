import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchEventsInRange, rangeQuerySchema } from "@/lib/activity-query";
import { computeMetrics, type MetricsEvent } from "@/lib/metrics";
import type { ActivityEventType } from "@/lib/types";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = rangeQuerySchema.safeParse({
    start: url.searchParams.get("start"),
    end: url.searchParams.get("end"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const { start, end } = parsed.data;
  const events = await fetchEventsInRange(session.user.id, start, end);
  const metricsEvents: MetricsEvent[] = events.map((e) => ({
    type: e.type as ActivityEventType,
    repoId: e.repoId,
    occurredAt: e.occurredAt,
  }));

  return NextResponse.json(computeMetrics(metricsEvents, { start, end }));
}
