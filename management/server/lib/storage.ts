import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AwsClient } from "aws4fetch";
import type { Env } from "../env";
import { HttpError } from "./http";

/** Cheile sunt generate de server (uuid), deci nu pot ieși din directorul de fișiere. */
function s3(env: Env) {
  if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) return null;
  const client = new AwsClient({ accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY, service: "s3", region: "auto" });
  const base = `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}`;
  return { client, url: (key: string) => `${base}/${encodeURIComponent(key)}` };
}

const localPath = (env: Env, key: string) => join(env.DATA_DIR, "files", key);

export async function putFile(env: Env, key: string, data: Buffer): Promise<void> {
  const remote = s3(env);
  if (remote) {
    const res = await remote.client.fetch(remote.url(key), { method: "PUT", body: data });
    if (!res.ok) throw new HttpError(502, "storage_error", "Fișierul nu a putut fi salvat");
    return;
  }
  await mkdir(join(env.DATA_DIR, "files"), { recursive: true });
  await writeFile(localPath(env, key), data);
}

export async function getFile(env: Env, key: string): Promise<Buffer> {
  const remote = s3(env);
  if (remote) {
    const res = await remote.client.fetch(remote.url(key));
    if (!res.ok) throw new HttpError(502, "storage_error", "Fișierul nu a putut fi citit");
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await readFile(localPath(env, key));
  } catch {
    throw new HttpError(404, "file_missing", "Fișierul lipsește din storage");
  }
}

export async function deleteFile(env: Env, key: string): Promise<void> {
  const remote = s3(env);
  if (remote) {
    await remote.client.fetch(remote.url(key), { method: "DELETE" });
    return;
  }
  await unlink(localPath(env, key)).catch(() => undefined);
}
