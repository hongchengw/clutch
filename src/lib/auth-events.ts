import { encryptToken } from "./crypto";

export interface SignInProfile {
  githubId: string;
  githubUsername: string;
  email: string | null;
  name: string | null;
  image: string | null;
  accessToken: string;
  providerAccountId: string;
}

// Structural subset of PrismaClient so the logic is unit-testable
// without a live database (tests inject a mock).
export interface SignInDb {
  user: {
    upsert(args: {
      where: { githubId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }): Promise<{ id: string; internshipStartDate: Date | null }>;
    update(args: {
      where: { id: string };
      data: { internshipStartDate: Date };
    }): Promise<unknown>;
  };
  account: {
    upsert(args: {
      where: {
        provider_providerAccountId: {
          provider: string;
          providerAccountId: string;
        };
      };
      create: Record<string, unknown> & { access_token: string };
      update: Record<string, unknown> & { access_token: string };
    }): Promise<unknown>;
  };
}

/**
 * Runs on every GitHub sign-in (A1, SPEC §7.1): upserts the User keyed
 * by githubId, defaults internshipStartDate to "today" only when unset,
 * and stores the OAuth access token AES-encrypted (SPEC §15).
 */
export async function upsertUserOnSignIn(
  db: SignInDb,
  profile: SignInProfile,
  now: Date = new Date()
): Promise<{ userId: string }> {
  const user = await db.user.upsert({
    where: { githubId: profile.githubId },
    create: {
      githubId: profile.githubId,
      githubUsername: profile.githubUsername,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      role: "intern",
    },
    update: {
      githubUsername: profile.githubUsername,
      email: profile.email,
      name: profile.name,
      image: profile.image,
    },
  });

  if (!user.internshipStartDate) {
    await db.user.update({
      where: { id: user.id },
      data: { internshipStartDate: now },
    });
  }

  const encrypted = encryptToken(profile.accessToken);
  await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "github",
        providerAccountId: profile.providerAccountId,
      },
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider: "github",
      providerAccountId: profile.providerAccountId,
      access_token: encrypted,
    },
    update: { access_token: encrypted },
  });

  return { userId: user.id };
}
