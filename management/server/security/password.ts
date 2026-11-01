/**
 * Hash-uirea și verificarea parolelor cu scrypt (node:crypto).
 * Format stocat: `scrypt$N$r$p$saltHex$hashHex`.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** Costul scrypt: N=2^15, r=8, p=1, cheie de 64 bytes, sare de 16 bytes. */
const SCRYPT_N = 2 ** 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_MEM = 128 * 1024 * 1024;

/** Parola acceptată la înregistrare/resetare: 12–200 caractere. */
export const passwordSchema = z.string().min(12).max(200);

/** Rulează scrypt pe un fir de execuție din pool-ul libuv (non-blocking). */
function scryptAsync(password: string, salt: Buffer, keylen: number, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { N, r, p, maxmem: MAX_MEM }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/** Generează hash-ul unei parole: `scrypt$N$r$p$saltHex$hashHex`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Verifică o parolă față de hash-ul stocat; hash lipsă/invalid → `false`. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N <= 0 || r <= 0 || p <= 0) return false;

  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  if (salt.length === 0 || expected.length === 0 || salt.toString("hex") !== parts[4] || expected.toString("hex") !== parts[5]) {
    return false;
  }

  let actual: Buffer;
  try {
    actual = await scryptAsync(password, salt, expected.length, N, r, p);
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
