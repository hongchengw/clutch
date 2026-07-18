import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "@/lib/crypto";

describe("token encryption (A1 — SPEC §15: encrypt OAuth tokens at rest)", () => {
  const token = "gho_exampleAccessToken123456";

  it("round-trips a token through encrypt/decrypt", () => {
    const encrypted = encryptToken(token);
    expect(decryptToken(encrypted)).toBe(token);
  });

  it("never stores the plaintext token", () => {
    const encrypted = encryptToken(token);
    expect(encrypted).not.toContain(token);
  });

  it("produces a different ciphertext each call (random IV)", () => {
    expect(encryptToken(token)).not.toBe(encryptToken(token));
  });

  it("rejects tampered ciphertext (authenticated encryption)", () => {
    const encrypted = encryptToken(token);
    const parts = encrypted.split(".");
    // flip a character in the ciphertext segment
    const c = parts[1];
    parts[1] = (c[0] === "A" ? "B" : "A") + c.slice(1);
    expect(() => decryptToken(parts.join("."))).toThrow();
  });

  it("throws a clear error when TOKEN_ENCRYPTION_KEY is missing", () => {
    const saved = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    try {
      expect(() => encryptToken(token)).toThrow(/TOKEN_ENCRYPTION_KEY/);
    } finally {
      process.env.TOKEN_ENCRYPTION_KEY = saved;
    }
  });
});
