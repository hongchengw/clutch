import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

const prismaMock = mockDeep<PrismaClient>();
const authMock = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));

import { PATCH } from "@/app/api/user/route";

function patchReq(body: unknown) {
  return new Request("http://localhost/api/user", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/user (A1 — internship dates editable)", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    authMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await PATCH(patchReq({ internshipStartDate: "2026-06-01" }));
    expect(res.status).toBe(401);
  });

  it("updates internship start and end dates", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    prismaMock.user.update.mockResolvedValue({
      id: "user_1",
      internshipStartDate: new Date("2026-06-01"),
      internshipEndDate: new Date("2026-08-28"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const res = await PATCH(
      patchReq({
        internshipStartDate: "2026-06-01",
        internshipEndDate: "2026-08-28",
      })
    );
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({
          internshipStartDate: new Date("2026-06-01"),
          internshipEndDate: new Date("2026-08-28"),
        }),
      })
    );
  });

  it("rejects an invalid date payload with 400", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    const res = await PATCH(patchReq({ internshipStartDate: "not-a-date" }));
    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
