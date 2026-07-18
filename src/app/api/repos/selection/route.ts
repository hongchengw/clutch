import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const selectionSchema = z.object({
  repos: z
    .array(
      z.object({
        githubRepoId: z.string().min(1),
        owner: z.string().min(1),
        name: z.string().min(1),
        fullName: z.string().min(1),
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
