import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GitHub owner/repo segment: word chars, dots, dashes only — blocks
// path traversal ("..", ".") and injection into API URLs (audit F1).
const ghSegment = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/)
  .refine((s) => !/^\.+$/.test(s), { message: "Invalid repo segment" });

const selectionSchema = z.object({
  repos: z
    .array(
      z.object({
        githubRepoId: z.string().min(1),
        owner: ghSegment,
        name: ghSegment,
        fullName: z.string().min(1).max(201),
        private: z.boolean(),
        included: z.boolean(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = selectionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = session.user.id;
  for (const repo of parsed.data.repos) {
    await prisma.repoSelection.upsert({
      where: {
        userId_provider_githubRepoId: {
          userId,
          provider: "github",
          githubRepoId: repo.githubRepoId,
        },
      },
      create: {
        userId,
        provider: "github",
        githubRepoId: repo.githubRepoId,
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        private: repo.private,
        included: repo.included,
      },
      update: { included: repo.included, fullName: repo.fullName },
    });
  }

  return NextResponse.json({ ok: true, count: parsed.data.repos.length });
}
