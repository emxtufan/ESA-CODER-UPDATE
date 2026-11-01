import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";
import type { TLSSocket } from "node:tls";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { incidents, monitoringChecks, monitoringResults } from "../../db/schema/ops";
import type { Env } from "../../env";
import { notify } from "../notifications/service";

const TIMEOUT_MS = 10_000;
const SSL_WARN_DAYS = 30;

/** Rețele care nu sunt internet public: verificările nu au voie să ajungă la ele (SSRF). */
const blocked = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(net, bits, "ipv4");
}
for (const [net, bits] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blocked.addSubnet(net, bits, "ipv6");
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return true;
  return blocked.check(address, family === 6 ? "ipv6" : "ipv4");
}

class BlockedTarget extends Error {}

/** Verifică adresa rezolvată chiar la conectare, deci și un DNS care se schimbă rămâne blocat. */
function safeLookup(
  hostname: string,
  options: { all?: boolean },
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
): void {
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    if (addresses.some((a) => isBlockedAddress(a.address))) return callback(new BlockedTarget("blocked"), "");
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0]!.address, addresses[0]!.family);
  });
}

export interface CheckResult {
  ok: boolean;
  httpStatus: number | null;
  responseMs: number | null;
  sslExpiresAt: Date | null;
  dnsOk: boolean | null;
  error: string | null;
}

function describeError(err: unknown): { message: string; dnsOk: boolean | null } {
  if (err instanceof BlockedTarget) return { message: "Adresă nepermisă", dnsOk: true };
  const code = (err as NodeJS.ErrnoException)?.code ?? "";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return { message: "Domeniul nu se rezolvă", dnsOk: false };
  if (code.startsWith("CERT_") || code.includes("SELF_SIGNED") || code === "ERR_TLS_CERT_ALTNAME_INVALID") {
    return { message: "Certificat SSL invalid", dnsOk: true };
  }
  return { message: "Nu răspunde", dnsOk: null };
}

/**
 * HTTP GET fără urmărirea redirecturilor (un redirect ar putea ținti rețeaua internă).
 * `allowPrivate` există doar pentru testele pe localhost; ruta și job-ul nu îl setează.
 */
export function checkUrl(url: string, opts: { allowPrivate?: boolean } = {}): Promise<CheckResult> {
  const fail = (message: string, dnsOk: boolean | null = null): CheckResult => ({
    ok: false,
    httpStatus: null,
    responseMs: null,
    sslExpiresAt: null,
    dnsOk,
    error: message,
  });
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return Promise.resolve(fail("Adresă invalidă"));
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") return Promise.resolve(fail("Adresă nepermisă"));
  const host = target.hostname.replace(/^\[|\]$/g, "");
  if (!opts.allowPrivate && isIP(host) && isBlockedAddress(host)) return Promise.resolve(fail("Adresă nepermisă"));

  const started = Date.now();
  const client = target.protocol === "https:" ? https : http;
  return new Promise((resolve) => {
    const req = client.request(
      target,
      {
        method: "GET",
        agent: false,
        timeout: TIMEOUT_MS,
        headers: { "user-agent": "esa-management-monitor", accept: "*/*" },
        ...(opts.allowPrivate ? {} : { lookup: safeLookup as never }),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        let sslExpiresAt: Date | null = null;
        if (target.protocol === "https:") {
          const validTo = (res.socket as TLSSocket).getPeerCertificate?.()?.valid_to;
          if (validTo) sslExpiresAt = new Date(validTo);
        }
        res.destroy();
        resolve({
          ok: status >= 200 && status < 400,
          httpStatus: status,
          responseMs: Date.now() - started,
          sslExpiresAt,
          dnsOk: true,
          error: status >= 400 ? `HTTP ${status}` : null,
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (err) => {
      const { message, dnsOk } = describeError(err);
      resolve(fail(message, dnsOk));
    });
    req.end();
  });
}

const autoIncidentName = (url: string) => `${url} nu răspunde`;

/** Rulează o verificare; „down” abia după două eșecuri la rând, ca o eroare izolată să nu alarmeze. */
export async function runCheck(
  db: Db,
  env: Env,
  check: typeof monitoringChecks.$inferSelect,
  probe: (url: string) => Promise<CheckResult> = checkUrl,
): Promise<CheckResult> {
  const [previous] = await db
    .select({ ok: monitoringResults.ok })
    .from(monitoringResults)
    .where(eq(monitoringResults.checkId, check.id))
    .orderBy(desc(monitoringResults.at))
    .limit(1);
  const result = await probe(check.url);
  await db.insert(monitoringResults).values({ checkId: check.id, ...result });

  const wasDown = check.lastStatus === "down";
  const down = !result.ok && previous !== undefined && !previous.ok;
  const lastStatus = result.ok ? "up" : down ? "down" : check.lastStatus;
  await db.update(monitoringChecks).set({ lastStatus, lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(monitoringChecks.id, check.id));

  const name = autoIncidentName(check.url);
  if (down && !wasDown) {
    await db.insert(incidents).values({ name, projectId: check.projectId, severity: "High", status: "Open", description: result.error });
    await notify(db, env, {
      event: "Server Down",
      dedupeKey: `monitor:${check.id}:${new Date().toISOString().slice(0, 13)}`,
      title: name,
      body: result.error ?? undefined,
      link: "/monitoring",
    });
  }
  if (result.ok && wasDown) {
    await db
      .update(incidents)
      .set({ status: "Resolved", endedAt: new Date(), resolution: "Revenit automat", updatedAt: new Date() })
      .where(and(eq(incidents.name, name), eq(incidents.status, "Open"), isNull(incidents.endedAt)));
  }
  if (result.sslExpiresAt && result.sslExpiresAt.getTime() - Date.now() < SSL_WARN_DAYS * 86_400_000) {
    await notify(db, env, {
      event: "SSL Expiration",
      dedupeKey: `ssl-check:${check.id}:${result.sslExpiresAt.toISOString().slice(0, 10)}`,
      title: `Certificatul SSL pentru ${check.url} expiră curând`,
      link: "/monitoring",
    });
  }
  return result;
}