/**
 * TOTP (RFC 6238) cu secret base32, HOTP (RFC 4226) SHA1, 6 cifre, pas 30s,
 * fereastră de verificare ±1 pas și protecție anti-replay pe ultimul pas folosit.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const SECRET_BYTES = 20;
const DIGITS = 6;
const STEP_SECONDS = 30;
const ISSUER = "ESA%20Management";

/** Encodează bytes în base32 (fără padding). */
function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

/** Decodează base32 (ignoră padding/spații); `null` dacă apare un caracter invalid. */
function base32Decode(secret: string): Buffer | null {
  const clean = secret.toUpperCase().replace(/[\s=]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) return null;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return bytes.length > 0 ? Buffer.from(bytes) : null;
}

/** Codul HOTP de 6 cifre pentru un pas dat (RFC 4226); exportat pentru teste. */
export function hotp(key: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  counter.writeUInt32BE(step % 2 ** 32, 4);
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Secret nou base32 din 20 bytes aleatori. */
export function generateSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

/** URL `otpauth://` pentru aplicații de autentificare. */
export function otpauthUrl(secret: string, email: string): string {
  return `otpauth://totp/${ISSUER}:${encodeURIComponent(email)}?secret=${secret}&issuer=${ISSUER}`;
}

/**
 * Verifică un cod TOTP în fereastra ±1 pas.
 * Returnează pasul potrivit sau `null`. Un pas `<= lastStep` este refuzat (anti-replay).
 * `now` (ms epoch sau Date) e opțional — folosit la verificarea vectorilor cunoscuți.
 */
export function verifyTotp(
  secret: string,
  code: string,
  lastStep?: number | null,
  now: number | Date = Date.now(),
): number | null {
  const key = base32Decode(secret);
  if (!key) return null;

  const candidate = String(code ?? "").trim();
  if (!/^\d{6}$/.test(candidate)) return null;

  const nowMs = now instanceof Date ? now.getTime() : now;
  const currentStep = Math.floor(nowMs / 1000 / STEP_SECONDS);
  const candidateBuffer = Buffer.from(candidate, "utf8");

  for (const offset of [0, -1, 1]) {
    const step = currentStep + offset;
    if (step < 0) continue;
    if (lastStep !== undefined && lastStep !== null && step <= lastStep) continue;
    const expectedBuffer = Buffer.from(hotp(key, step), "utf8");
    if (expectedBuffer.length === candidateBuffer.length && timingSafeEqual(expectedBuffer, candidateBuffer)) {
      return step;
    }
  }

  return null;
}
