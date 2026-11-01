import { createHmac, timingSafeEqual } from "node:crypto";
import express, { Router } from "express";
import { sql, and, eq } from "drizzle-orm";
import { deployments, repositories, webhookDeliveries } from "../../db/schema";
import type { Db } from "../../db/client";
import { HttpError } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import type { Env } from "../../env";
import { notify } from "../notifications/service";
import { upsertCommit, upsertPull, upsertRelease } from "./sync";

/** Compară în timp constant semnătura GitHub cu HMAC-ul calculat pe raw body. */
export function verifySignature(secret: string, raw: Buffer, header: string | undefined): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`);
  const got = Buffer.from(header);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

const DEPLOY_STATUS: Record<string, "Pending" | "Running" | "Successful" | "Failed"> = {
  queued: "Pending",
  pending: "Pending",
  in_progress: "Running",
  success: "Successful",
  failure: "Failed",
  error: "Failed",
};

const toDate = (v: unknown) => (typeof v === "string" ? new Date(v) : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(db: Db, event: string, p: any): Promise<boolean> {
  const fullName: unknown = p.repository?.full_name;
  if (typeof fullName !== "string") return false;
  const [owner, name] = fullName.toLowerCase().split("/");
  // Repo necunoscut: ignorat, nu se creează și nu se leagă automat de un proiect.
  const [repo] = await db
    .select()
    .from(repositories)
    .where(and(sql`lower(${repositories.owner}) = ${owner}`, sql`lower(${repositories.name}) = ${name}`));
  if (!repo) return false;
  const projectId = repo.projectId;
  const actorLabel = "GitHub";

  if (event === "push") {
    const branch = String(p.ref ?? "").replace("refs/heads/", "");
    for (const c of p.commits ?? []) {
      await upsertCommit(db, repo.id, {
        hash: c.id,
        message: c.message ?? null,
        author: c.author?.name ?? null,
        authorEmail: c.author?.email ?? null,
        date: toDate(c.timestamp),
        branch,
        filesChanged: (c.added?.length ?? 0) + (c.removed?.length ?? 0) + (c.modified?.length ?? 0),
        url: c.url ?? null,
      });
    }
    const n = p.commits?.length ?? 0;
    if (projectId && n > 0) {
      await recordActivity(db, { projectId, actorLabel, type: "commit", description: `${n} commit-uri pe ${branch} în ${repo.name}`, entityType: "repository", entityId: repo.id });
    }
    return true;
  }

  if (event === "pull_request") {
    const pr = p.pull_request;
    await upsertPull(db, repo.id, {
      number: pr.number,
      title: pr.title ?? null,
      author: pr.user?.login ?? null,
      status: pr.merged_at ? "merged" : (pr.state ?? null),
      createdAt: toDate(pr.created_at),
      mergedAt: toDate(pr.merged_at),
      headRef: pr.head?.ref ?? null,
      baseRef: pr.base?.ref ?? null,
      url: pr.html_url ?? null,
    });
    if (projectId && (p.action === "opened" || pr.merged_at)) {
      await recordActivity(db, { projectId, actorLabel, type: "pull_request", description: `PR #${pr.number} ${pr.merged_at ? "fuzionat" : "deschis"}: ${pr.title ?? ""}`, entityType: "repository", entityId: repo.id });
    }
    return true;
  }

  if (event === "release") {
    if (p.action !== "published") return true;
    const r = p.release;
    await upsertRelease(db, repo.id, { version: r.name || r.tag_name, tag: r.tag_name, notes: r.body ?? null, date: toDate(r.published_at) });
    if (projectId) {
      await recordActivity(db, { projectId, actorLabel, type: "release", description: `Release ${r.tag_name} în ${repo.name}`, entityType: "repository", entityId: repo.id });
    }
    return true;
  }

  if (event === "deployment" || event === "deployment_status") {
    // Deployment-urile cer proiect; un repo nelegat de proiect nu le poate înregistra.
    if (!projectId) return false;
    const d = p.deployment;
    const state = event === "deployment" ? "pending" : p.deployment_status?.state;
    const status = DEPLOY_STATUS[state];
    // `inactive` înseamnă înlocuit, nu rollback: statusul rămâne cel înregistrat.
    if (!status) return true;
    const url = p.deployment_status?.environment_url || p.deployment_status?.target_url || null;
    const externalId = String(d.id);
    await db
      .insert(deployments)
      .values({ projectId, repositoryId: repo.id, commitHash: d.sha ?? null, branch: d.ref ?? null, environment: d.environment ?? null, deployedAt: toDate(d.created_at) ?? new Date(), status, url, externalId })
      .onConflictDoUpdate({ target: deployments.externalId, set: { status, ...(url ? { url } : {}), updatedAt: new Date() } });
    const [row] = await db.select({ id: deployments.id }).from(deployments).where(eq(deployments.externalId, externalId));
    if (event === "deployment_status") {
      await recordActivity(db, { projectId, actorLabel, type: "deploy", description: `Deployment ${d.environment ?? ""}: ${status}`, entityType: "deployment", entityId: row?.id });
    }
    return true;
  }

  return false;
}

/** După commit-ul tranzacției: notificarea nu trebuie să țină deschisă tranzacția webhook-ului. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyFromWebhook(db: Db, env: Env, event: string, deliveryId: string, p: any): Promise<void> {
  if (event === "push" && (p.commits?.length ?? 0) > 0) {
    await notify(db, env, {
      event: "New Commit",
      dedupeKey: `push:${deliveryId}`,
      title: `${p.commits.length} commit-uri noi în ${p.repository?.full_name ?? ""}`,
      link: "/github?tab=commits",
    });
  }
  const state = p.deployment_status?.state;
  if (event === "deployment_status" && (state === "failure" || state === "error")) {
    await notify(db, env, {
      event: "Failed Deployment",
      dedupeKey: `deployment:${p.deployment?.id}:failed`,
      title: `Deployment eșuat: ${p.deployment?.environment ?? ""}`,
      link: "/deployments",
    });
  }
}

/** POST /api/webhooks/github — singura intrare fără sesiune; autentificată prin HMAC pe raw body. */
export function githubWebhookRouter(): Router {
  const router = Router();
  router.post("/", express.raw({ type: "*/*", limit: "5mb" }), async (req, res) => {
    const secret = req.ctx.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) throw new HttpError(503, "webhook_not_configured", "Webhook-ul GitHub nu este configurat");
    const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!verifySignature(secret, raw, req.header("x-hub-signature-256"))) {
      throw new HttpError(401, "invalid_signature", "Semnătură invalidă");
    }
    const deliveryId = req.header("x-github-delivery");
    const event = req.header("x-github-event");
    if (!deliveryId || !event) throw new HttpError(400, "invalid_webhook", "Lipsesc antetele GitHub");
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new HttpError(400, "invalid_webhook", "Conținut invalid");
    }
    // Tranzacție: dacă procesarea pică, dedupe se anulează și reîncercarea GitHub trece.
    const result = await req.ctx.db.transaction(async (tx) => {
      const db = tx as unknown as Db;
      const inserted = await db.insert(webhookDeliveries).values({ deliveryId, event }).onConflictDoNothing().returning({ id: webhookDeliveries.id });
      if (inserted.length === 0) return { duplicate: true };
      return { duplicate: false, handled: await handleEvent(db, event, payload) };
    });
    if (!result.duplicate && result.handled) {
      await notifyFromWebhook(req.ctx.db, req.ctx.env, event, deliveryId, payload);
    }
    res.json(result);
  });
  return router;
}
