/**
 * Jurnalul de audit (append-only): listare paginată cu filtre pe acțiune, actor și tip
 * de entitate, plus căutare liberă în numele/emailul actorului. Doar citire.
 */
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { auditLogs, users } from "../../db/schema/auth";
import { pageQuery, paged, parse } from "../../lib/http";
import { requirePermission } from "../../security/guards";

const listQuery = pageQuery.extend({
  action: z.string().trim().min(1).optional(),
  actorId: z.uuid("Identificator invalid").optional(),
  entityType: z.string().trim().min(1).optional(),
});

export function auditRouter(): Router {
  const router = Router();

  /** Intrările de audit, cele mai recente primele, cu numele actorului din `users`. */
  router.get("/", requirePermission("audit.view"), async (req, res) => {
    const query = parse(listQuery, req.query);
    const { db } = req.ctx;
    const search = query.q ? `%${query.q}%` : undefined;

    const where = and(
      query.action ? eq(auditLogs.action, query.action) : undefined,
      query.actorId ? eq(auditLogs.actorId, query.actorId) : undefined,
      query.entityType ? eq(auditLogs.entityType, query.entityType) : undefined,
      search
        ? or(
            ilike(users.name, search),
            ilike(users.email, search),
            ilike(auditLogs.action, search),
          )
        : undefined,
    );

    const items = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorName: users.name,
        actorEmail: users.email,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        meta: auditLogs.meta,
        ip: auditLogs.ip,
        at: auditLogs.at,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(where)
      .orderBy(desc(auditLogs.at))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    // Numărătoarea are nevoie de același join: filtrul `q` poate privi coloanele actorului.
    const [totals] = await db
      .select({ total: count() })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(where);

    res.json(paged(items, totals?.total ?? 0, query));
  });

  return router;
}
