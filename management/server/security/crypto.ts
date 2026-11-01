/**
 * Criptare simetrică pentru secretele din vault: AES-256-GCM cu IV aleator.
 * Format blob: `v1.<base64url(iv|tag|ct)>` (iv 12 bytes, tag 16 bytes).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { HttpError } from "../lib/http";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const VERSION = "v1";

/** Cheia AES-256 (hex) din config; lipsă → 503 `vault_not_configured`. */
function resolveKey(keyHex: string | null | undefined): Buffer {
  if (!keyHex) throw new HttpError(503, "vault_not_configured", "Seiful nu este configurat");
  return Buffer.from(keyHex, "hex");
}

/** Criptează un secret; `aad` (utf8) leagă blob-ul de contextul lui. */
export function encryptSecret(plain: string, keyHex: string | null | undefined, aad?: string): string {
  const key = resolveKey(keyHex);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`;
}

/** Decriptează un blob `v1.<base64url(iv|tag|ct)>`; aruncă dacă e corupt/cheie greșită. */
export function decryptSecret(blob: string, keyHex: string | null | undefined, aad?: string): string {
  const key = resolveKey(keyHex);

  const separator = blob.indexOf(".");
  if (separator <= 0 || blob.slice(0, separator) !== VERSION) {
    throw new Error("Blob criptat invalid");
  }

  const raw = Buffer.from(blob.slice(separator + 1), "base64url");
  if (raw.length < IV_BYTES + TAG_BYTES) throw new Error("Blob criptat invalid");

  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
