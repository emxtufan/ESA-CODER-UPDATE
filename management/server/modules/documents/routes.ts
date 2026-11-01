import { createHash, randomUUID } from "node:crypto";
import express, { Router, type Request } from "express";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { DOCUMENT_TYPES } from "../../../shared/enums";
import type { Db } from "../../db/client";
import { clients, projects } from "../../db/schema/core";
import { documents, documentVersions } from "../../db/schema/ops";
import { crudRouter, dateStr, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { getFile, putFile } from "../../lib/storage";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { assertAllowedFile, canPreview, fileHeaders, signLink, verifyLink } from "./files";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_LINK_MINUTES = 24 * 60;

const documentSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(DOCUMENT_TYPES),
  clientId: z.uuid().nullable().optional(),
  projectId: z.uuid().nullable().optional(),
  expirationDate: dateStr,
  notes: optStr,
});

async function loadDocument(db: Db, rawId: unknown) {
  const id = parse(z.uuid(), rawId);
  const [row] = await db.select().from(documents).where(and(eq(documents.id, id), isNull(documents.deletedAt)));
  if (!row) throw new HttpError(404, "not_found", "Documentul nu există");
  return row;
}

/** Versiunea cerută sau cea curentă; versiunea trebuie să fie a acestui document. */
async function loadVersion(db: Db, doc: typeof documents.$inferSelect, rawVersionId: unknown) {
  const versionId = rawVersionId ? parse(z.uuid(), rawVersionId) : doc.currentVersionId;
  if (!versionId) throw new HttpError(404, "no_file", "Documentul nu are încă un fișier");
  const [version] = await db
    .select()
    .from(documentVersions)
    .where(and(eq(documentVersions.id, versionId), eq(documentVersions.documentId, doc.id)));
  if (!version) throw new HttpError(404, "not_found", "Versiunea nu există");
  return version;
}

async function attachInfo(rows: (typeof documents.$inferSelect)[], req: Request) {
  const db = req.ctx.db;
  const ids = rows.map((r) => r.id);
  const clientIds = [...new Set(rows.map((r) => r.clientId).filter((v): v is string => Boolean(v)))];
  const projectIds = [...new Set(rows.map((r) => r.projectId).filter((v): v is string => Boolean(v)))];
  const counts = ids.length
    ? await db.select({ id: documentVersions.documentId, n: count() }).from(documentVersions).where(inArray(documentVersions.documentId, ids)).groupBy(documentVersions.documentId)
    : [];
  const clientRows = clientIds.length ? await db.select({ id: clients.id, name: clients.companyName }).from(clients).where(inArray(clients.id, clientIds)) : [];
  const projectRows = projectIds.length ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, projectIds)) : [];
  const versions = new Map(counts.map((c) => [c.id, c.n]));
  const clientNames = new Map(clientRows.map((c) => [c.id, c.name]));
  const projectNames = new Map(projectRows.map((p) => [p.id, p.name]));
  return rows.map((r) => ({
    ...r,
    versionCount: versions.get(r.id) ?? 0,
    clientName: r.clientId ? (clientNames.get(r.clientId) ?? null) : null,
    projectName: r.projectId ? (projectNames.get(r.projectId) ?? null) : null,
  }));
}

export function documentsRouter(): Router {
  const router = Router();

  /** Corpul e fișierul brut; numele și tipul vin în antete. Clientul trimite `application/octet-stream`. */
  router.post(
    "/:id/versions",
    requirePermission("documents.update"),
    express.raw({ type: "application/octet-stream", limit: MAX_BYTES }),
    async (req, res) => {
      const db = req.ctx.db;
      const doc = await loadDocument(db, req.params.id);
      const data: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const mime = String(req.header("x-file-mime") ?? "");
      assertAllowedFile(mime, data);
      const storageKey = randomUUID();
      await putFile(req.ctx.env, storageKey, data);
      const [last] = await db
        .select({ version: documentVersions.version })
        .from(documentVersions)
        .where(eq(documentVersions.documentId, doc.id))
        .orderBy(desc(documentVersions.version))
        .limit(1);
      const [version] = await db
        .insert(documentVersions)
        .values({
          documentId: doc.id,
          version: (last?.version ?? 0) + 1,
          storageKey,
          mime,
          size: data.length,
          sha256: createHash("sha256").update(data).digest("hex"),
          uploadedById: req.auth?.user.id ?? null,
        })
        .returning();
      await db.update(documents).set({ currentVersionId: version!.id, updatedAt: new Date() }).where(eq(documents.id, doc.id));
      await audit(req, "document_upload", "document", doc.id, { version: version!.version, size: data.length });
      const { storageKey: _key, ...safe } = version!;
      res.status(201).json({ item: safe });
    },
  );

  router.get("/:id/versions", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const doc = await loadDocument(db, req.params.id);
    const rows = await db
      .select({
        id: documentVersions.id,
        version: documentVersions.version,
        mime: documentVersions.mime,
        size: documentVersions.size,
        sha256: documentVersions.sha256,
        createdAt: documentVersions.createdAt,
      })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, doc.id))
      .orderBy(desc(documentVersions.version));
    res.json({ items: rows.map((r) => ({ ...r, preview: canPreview(r.mime) })) });
  });

  router.get("/:id/download", requirePermission("documents.download"), async (req, res) => {
    const db = req.ctx.db;
    const doc = await loadDocument(db, req.params.id);
    const version = await loadVersion(db, doc, req.query.version);
    const data = await getFile(req.ctx.env, version.storageKey);
    await audit(req, "document_download", "document", doc.id, { version: version.version });
    res.set(fileHeaders(version.mime, doc.name, req.query.inline === "1")).send(data);
  });

  router.post("/:id/link", requirePermission("documents.download"), async (req, res) => {
    const key = req.ctx.env.FILE_SIGNING_KEY;
    if (!key) throw new HttpError(503, "signing_not_configured", "Linkurile temporare cer FILE_SIGNING_KEY");
    const db = req.ctx.db;
    const body = parse(z.object({ minutes: z.coerce.number().int().min(1).max(MAX_LINK_MINUTES).optional(), version: z.uuid().optional() }), req.body ?? {});
    const doc = await loadDocument(db, req.params.id);
    const version = await loadVersion(db, doc, body.version);
    const expires = Date.now() + (body.minutes ?? 15) * 60_000;
    const sig = signLink(key, version.id, expires);
    await audit(req, "document_link_created", "document", doc.id, { version: version.version, expires });
    res.json({ url: `/api/files/${version.id}?expires=${expires}&sig=${sig}`, expiresAt: new Date(expires).toISOString() });
  });

  router.use(
    crudRouter({
      table: documents,
      entityType: "document",
      permission: "documents",
      softDelete: true,
      schema: documentSchema,
      searchColumns: [documents.name, documents.notes],
      filters: { type: documents.type, clientId: documents.clientId, projectId: documents.projectId },
      sortable: { name: documents.name, uploadDate: documents.uploadDate, expirationDate: documents.expirationDate },
      defaultSort: { column: documents.uploadDate, dir: "desc" },
      listTransform: attachInfo as never,
    }),
  );

  return router;
}

/** GET /api/files/:versionId — fără sesiune; accesul vine doar din semnătura temporară. */
export function signedFilesRouter(): Router {
  const router = Router();
  router.get("/:versionId", async (req, res) => {
    const key = req.ctx.env.FILE_SIGNING_KEY;
    const versionId = parse(z.uuid(), req.params.versionId);
    const expires = Number(req.query.expires);
    const sig = String(req.query.sig ?? "");
    if (!key || !verifyLink(key, versionId, expires, sig)) {
      throw new HttpError(403, "invalid_link", "Linkul este invalid sau a expirat");
    }
    const [row] = await req.ctx.db
      .select({ version: documentVersions, name: documents.name })
      .from(documentVersions)
      .innerJoin(documents, eq(documentVersions.documentId, documents.id))
      .where(and(eq(documentVersions.id, versionId), isNull(documents.deletedAt)));
    if (!row) throw new HttpError(404, "not_found", "Fișierul nu mai există");
    const data = await getFile(req.ctx.env, row.version.storageKey);
    res.set(fileHeaders(row.version.mime, row.name, req.query.inline === "1")).send(data);
  });
  return router;
}
