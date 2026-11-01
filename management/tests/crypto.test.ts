/**
 * Teste de criptare, hash-uire a parolelor și TOTP.
 */
import { describe, expect, it } from "vitest";

import { HttpError } from "../server/lib/http";
import { decryptSecret, encryptSecret } from "../server/security/crypto";
import { hashPassword, verifyPassword } from "../server/security/password";
import { hotp, verifyTotp } from "../server/security/totp";

/** Cheie AES-256 validă: exact 64 caractere hex. */
const KEY = "a1".repeat(32);

/** Cheia de test din RFC 6238 (ASCII, 20 bytes) și forma ei base32. */
const RFC_KEY = Buffer.from("12345678901234567890", "ascii");
const RFC_SECRET_BASE32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("crypto: AES-256-GCM", () => {
  it("encrypt/decrypt face round-trip, inclusiv cu AAD", () => {
    const blob = encryptSecret("secret-ultra-secret", KEY, "totp:user-1");
    expect(blob.startsWith("v1.")).toBe(true);
    expect(blob).not.toContain("secret-ultra-secret");
    expect(decryptSecret(blob, KEY, "totp:user-1")).toBe("secret-ultra-secret");
  });

  it("AAD greșit nu decriptează", () => {
    const blob = encryptSecret("valoare", KEY, "totp:user-1");
    expect(() => decryptSecret(blob, KEY, "totp:user-2")).toThrow();
  });

  it("un blob modificat nu decriptează", () => {
    const blob = encryptSecret("valoare", KEY);
    const raw = Buffer.from(blob.slice("v1.".length), "base64url");
    raw[raw.length - 1] ^= 0xff;
    const tampered = `v1.${raw.toString("base64url")}`;
    expect(() => decryptSecret(tampered, KEY)).toThrow();
  });

  it("cheia lipsă dă 503 vault_not_configured", () => {
    let caught: unknown;
    try {
      encryptSecret("valoare", null);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as HttpError).status).toBe(503);
    expect((caught as HttpError).code).toBe("vault_not_configured");

    expect(() => decryptSecret("v1.abc", undefined)).toThrow(HttpError);
  });
});

describe("password: scrypt", () => {
  it("hash/verify round-trip, fără parola în hash", async () => {
    const stored = await hashPassword("Parola-teste-123");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(stored).not.toContain("Parola-teste-123");
    expect(await verifyPassword("Parola-teste-123", stored)).toBe(true);
    expect(await verifyPassword("Parola-teste-124", stored)).toBe(false);
  });

  it("hash lipsă sau invalid nu verifică niciodată", async () => {
    expect(await verifyPassword("Parola-teste-123", null)).toBe(false);
    expect(await verifyPassword("Parola-teste-123", "plain-text")).toBe(false);
  });
});

describe("TOTP", () => {
  it("hotp respectă vectorul RFC 6238 (T=59 → 287082 pe 6 cifre)", () => {
    // T=59 → pas = floor(59 / 30) = 1.
    expect(hotp(RFC_KEY, 1)).toBe("287082");
  });

  it("verifyTotp acceptă vectorul RFC la un moment dat și refuză refolosirea", () => {
    const nowMs = 59_000;
    expect(verifyTotp(RFC_SECRET_BASE32, "287082", null, nowMs)).toBe(1);
    // Același pas deja folosit (anti-replay) → refuzat.
    expect(verifyTotp(RFC_SECRET_BASE32, "287082", 1, nowMs)).toBeNull();
    // Cod greșit / format greșit → refuzat.
    expect(verifyTotp(RFC_SECRET_BASE32, "287083", null, nowMs)).toBeNull();
    expect(verifyTotp(RFC_SECRET_BASE32, "28708", null, nowMs)).toBeNull();
    // Secret invalid (base32) → refuzat.
    expect(verifyTotp("nu-e-base32!", "287082", null, nowMs)).toBeNull();
  });
});
