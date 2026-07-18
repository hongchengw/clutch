import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGitHubClient, getGitHubToken } from "@/lib/github";
import { syncAllRepos } from "@/lib/sync";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, githubUsername: true, email: true },
  });
  if (!user?.githubUsername) {
    return NextResponse.json(
      { error: "No GitHub connection" },
      { status: 400 }
    );
  }

  const token = await getGitHubToken(user.id);
  if (!token) {
    return NextResponse.json(
      { error: "No GitHub connection" },
      { status: 400 }
    );
  }

  const result = await syncAllRepos(prisma, createGitHubClient(token), {
    id: user.id,
    githubUsername: user.githubUsername,
    verifiedEmails: user.email ? [user.email] : [],
  });

  return NextResponse.json(result);
}
