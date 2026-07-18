import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  fetchEventsInRange,
  rangeQuerySchema,
  toEventDTO,
} from "@/lib/activity-query";

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

  const events = await fetchEventsInRange(
    session.user.id,
    parsed.data.start,
    parsed.data.end
  );

  return NextResponse.json({ events: events.map(toEventDTO) });
}
