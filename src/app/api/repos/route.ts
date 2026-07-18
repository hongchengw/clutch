import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGitHubClient, getGitHubToken } from "@/lib/github";
import type { RepoDTO } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGitHubToken(session.user.id);
  if (!token) {
    return NextResponse.json(
      { error: "No GitHub connection" },
      { status: 400 }
    );
  }

  const [ghRepos, selections] = await Promise.all([
    createGitHubClient(token).listUserRepos(),
    prisma.repoSelection.findMany({
      where: { userId: session.user.id, provider: "github" },
      select: { githubRepoId: true, included: true, lastSyncedAt: true },
    }),
  ]);

  // Explicit type: Prisma client may not be fully generated in offline envs.
  type SelectionRow = {
    githubRepoId: string;
    included: boolean;
    lastSyncedAt: Date | null;
  };
  const byId = new Map<string, SelectionRow>(
    (selections as SelectionRow[]).map((s) => [s.githubRepoId, s]),
  );
  const repos: RepoDTO[] = ghRepos.map((r) => {
    const sel = byId.get(r.githubRepoId);
    return {
      ...r,
      included: sel?.included ?? false,
      lastSyncedAt: sel?.lastSyncedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ repos });
}
