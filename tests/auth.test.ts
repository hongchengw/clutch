import { describe, it, expect, vi, beforeEach } from "vitest";
import { upsertUserOnSignIn, type SignInProfile } from "@/lib/auth-events";
import { decryptToken } from "@/lib/crypto";

function makeDb() {
  return {
    user: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    account: {
      upsert: vi.fn(),
    },
  };
}

const profile: SignInProfile = {
  githubId: "12345",
  githubUsername: "maya-intern",
  email: "maya@example.com",
  name: "Maya",
  image: "https://avatars.githubusercontent.com/u/12345",
  accessToken: "gho_secretToken",
  providerAccountId: "12345",
};

describe("sign-in upsert (A1 — SPEC §7.1)", () => {
  let db: ReturnType<typeof makeDb>;

  beforeEach(() => {
    db = makeDb();
    db.user.upsert.mockResolvedValue({
      id: "user_1",
      internshipStartDate: null,
    });
    db.user.update.mockResolvedValue({ id: "user_1" });
    db.account.upsert.mockResolvedValue({ id: "acct_1" });
  });

  it("upserts the user keyed by githubId with intern defaults", async () => {
    await upsertUserOnSignIn(db, profile);

    expect(db.user.upsert).toHaveBeenCalledTimes(1);
    const args = db.user.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ githubId: "12345" });
    expect(args.create).toMatchObject({
      githubId: "12345",
      githubUsername: "maya-intern",
      email: "maya@example.com",
      role: "intern",
    });
  });

  it("defaults internshipStartDate to today when unset", async () => {
    const now = new Date("2026-07-18T12:00:00Z");
    await upsertUserOnSignIn(db, profile, now);

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: { internshipStartDate: now },
      })
    );
  });

  it("does not overwrite an existing internshipStartDate", async () => {
    db.user.upsert.mockResolvedValue({
      id: "user_1",
      internshipStartDate: new Date("2026-06-01"),
    });
    await upsertUserOnSignIn(db, profile);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("stores the OAuth token encrypted, never plaintext", async () => {
    await upsertUserOnSignIn(db, profile);

    expect(db.account.upsert).toHaveBeenCalledTimes(1);
    const args = db.account.upsert.mock.calls[0][0];
    const stored: string = args.create.access_token;
    expect(stored).toBeTruthy();
    expect(stored).not.toContain("gho_secretToken");
    expect(decryptToken(stored)).toBe("gho_secretToken");
    // update path must also re-encrypt
    expect(args.update.access_token).not.toContain("gho_secretToken");
  });

  it("returns the user id for session mapping", async () => {
    const result = await upsertUserOnSignIn(db, profile);
    expect(result.userId).toBe("user_1");
  });
});
