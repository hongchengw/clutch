import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "./prisma";
import { upsertUserOnSignIn } from "./auth-events";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Minimum scopes for private-repo read access (SPEC §13)
      authorization: { params: { scope: "read:user user:email repo" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const { userId } = await upsertUserOnSignIn(prisma, {
          githubId: String(profile.id),
          githubUsername: String(profile.login ?? ""),
          email: (profile.email as string | null) ?? null,
          name: (profile.name as string | null) ?? null,
          image: (profile.avatar_url as string | null) ?? null,
          accessToken: account.access_token ?? "",
          providerAccountId: account.providerAccountId,
        });
        token.userId = userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
