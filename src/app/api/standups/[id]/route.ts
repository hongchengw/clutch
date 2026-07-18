import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toStandupDTO } from "@/lib/standup-dto";

type RouteContext = { params: Promise<{ id: string }> };

async function findOwnedDoc(id: string, userId: string) {
  const doc = await prisma.standupDoc.findUnique({ where: { id } });
  if (!doc || doc.userId !== userId) return null;
  return doc;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const doc = await findOwnedDoc(id, session.user.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toStandupDTO(doc));
}

const patchSchema = z
  .object({
    contentMd: z.string().min(1).optional(),
    contentJson: z.unknown().optional(),
  })
  .refine(
    (data) => data.contentMd !== undefined || data.contentJson !== undefined,
    { message: "Nothing to update" }
  );

export async function PATCH(req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const doc = await findOwnedDoc(id, session.user.id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await prisma.standupDoc.update({
    where: { id },
    data: {
      ...(parsed.data.contentMd !== undefined && {
        contentMd: parsed.data.contentMd,
      }),
      ...(parsed.data.contentJson !== undefined && {
        contentJson: parsed.data.contentJson as object,
      }),
    },
  });

  return NextResponse.json(toStandupDTO(updated));
}
