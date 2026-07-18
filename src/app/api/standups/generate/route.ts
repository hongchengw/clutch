import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchEventsInRange, toEventDTO } from "@/lib/activity-query";
import { resolveRange } from "@/lib/range";
import { generateStandup } from "@/lib/standup";
import { toStandupDTO } from "@/lib/standup-dto";

const generateSchema = z.object({
  preset: z.enum(["yesterday", "last7", "last30", "custom", "internship"]),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  tone: z.enum(["casual", "professional", "resume"]).default("casual"),
  length: z.enum(["short", "standard", "detailed"]).default("standard"),
  highlightMode: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = generateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { preset, start, end, tone, length, highlightMode } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { internshipStartDate: true },
  });

  let range;
  try {
    range = resolveRange(
      { preset, start, end },
      { internshipStartDate: user?.internshipStartDate ?? null }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid range" },
      { status: 400 }
    );
  }

  const events = await fetchEventsInRange(
    session.user.id,
    range.start,
    range.end
  );
  const generated = generateStandup(events.map(toEventDTO), {
    tone,
    length,
    highlightMode,
  });

  const doc = await prisma.standupDoc.create({
    data: {
      userId: session.user.id,
      rangeStart: range.start,
      rangeEnd: range.end,
      tone,
      length,
      contentMd: generated.contentMd,
      contentJson: generated.contentJson as object,
      eventIds: generated.eventIds,
    },
  });

  return NextResponse.json(toStandupDTO(doc));
}
