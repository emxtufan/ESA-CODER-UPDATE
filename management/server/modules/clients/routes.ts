/**
 * Rutele pentru clienți (§6): CRUD peste `clients` cu căutare pe datele de identificare
 * și filtre pe status/țară, un sumar (proiecte + activitate recentă) și CRUD-ul
 * contactelor suplimentare.
 */
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { CURRENCIES } from "../../../shared/enums";
import { activities, clients, contacts, projects } from "../../db/schema/core";
import { crudRouter, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Email opțional: string-ul gol devine `null`, câmpul absent rămâne `undefined`. */
const emailStr = z.preprocess(
  (value) => (value === "" ? null : value),
  z.email("Email invalid").nullable().optional(),
);

/** Website opțional, validat ca URL absolut. */
const webUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.url("URL invalid").nullable().optional(),
);

/** Câmpurile clientului din §6 (+ `isDemo` pentru datele DEMO ștergibile). */
const clientSchema = z.object({
  companyName: z.string().trim().min(1, "Numele companiei este obligatoriu").max(200),
  legalName: optStr,
  cui: optStr,
  regCom: optStr,
  vatStatus: optStr,
  country: optStr,
  city: optStr,
  address: optStr,
  postalCode: optStr,
  website: webUrl,
  industry: optStr,
  contactPerson: optStr,
  position: optStr,
  phone: optStr,
  primaryEmail: emailStr,
  billingEmail: emailStr,
  paymentTerms: optStr,
  preferredCurrency: z.enum(CURRENCIES).nullable().optional(),
  paymentMethod: optStr,
  status: optStr,
  internalNotes: optStr,
  isDemo: z.boolean().optional(),
});

/** Contactele suplimentare ale unui client (§6, tabela `contacts`). */
const contactSchema = z.object({
  clientId: z.uuid("Identificator invalid"),
  name: z.string().trim().min(1, "Numele contactului este obligatoriu").max(160),
  position: optStr,
  email: emailStr,
  phone: optStr,
  notes: optStr,
});

/** Intrare în timeline-ul clientului (creare/modificare). */
async function clientActivity(
  req: Request,
  type: string,
  row: any,
  description: string,
): Promise<void> {
  await recordActivity(req.ctx.db, {
    clientId: row.id,
    actorId: req.auth?.user.id ?? null,
    type,
    description,
    entityType: "client",
    entityId: row.id,
  });
}

export function clientsRouter(): Router {
  const router = Router();

  // Sub-rutele proprii stau înainte de `crudRouter`, ca `/:id/summary` să nu ajungă la `/:id`.

  /** Sumarul clientului: proiectele lui + ultimele 20 de intrări din timeline. */
  router.get("/:id/summary", requirePermission("clients.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const { db } = req.ctx;

    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
      .limit(1);
    if (!client) throw new HttpError(404, "not_found", "Clientul nu există");

    const clientProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        websiteUrl: projects.websiteUrl,
      })
      .from(projects)
      .where(and(eq(projects.clientId, id), isNull(projects.deletedAt)))
      .orderBy(desc(projects.createdAt));

    const recentActivity = await db
      .select({
        id: activities.id,
        at: activities.at,
        actorId: activities.actorId,
        actorLabel: activities.actorLabel,
        type: activities.type,
        description: activities.description,
        entityType: activities.entityType,
        entityId: activities.entityId,
      })
      .from(activities)
      .where(eq(activities.clientId, id))
      .orderBy(desc(activities.at))
      .limit(20);

    res.json({ projects: clientProjects, recentActivity });
  });

  router.use(
    crudRouter({
      table: clients,
      entityType: "client",
      permission: "clients",
      schema: clientSchema,
      searchColumns: [clients.companyName, clients.legalName, clients.cui, clients.primaryEmail],
      filters: { status: clients.status, country: clients.country },
      sortable: {
        companyName: clients.companyName,
        createdAt: clients.createdAt,
        status: clients.status,
      },
      defaultSort: { column: clients.companyName },
      // Ștergerea e logică, deci FK-ul nu blochează: verificăm explicit proiectele active.
      beforeDelete: async (row: any, req: Request) => {
        const [total] = await req.ctx.db
          .select({ total: count() })
          .from(projects)
          .where(and(eq(projects.clientId, row.id), isNull(projects.deletedAt)));
        if ((total?.total ?? 0) > 0) {
          throw new HttpError(409, "conflict", "Clientul are proiecte asociate");
        }
      },
      afterCreate: (row: any, req: Request) =>
        clientActivity(req, "client_created", row, `Client creat: ${row.companyName}`),
      afterUpdate: (row: any, req: Request) =>
        clientActivity(req, "client_updated", row, `Client actualizat: ${row.companyName}`),
    }),
  );

  return router;
}

/** Contactele suplimentare: CRUD peste `contacts`, filtrat pe `clientId`, sub `clients`. */
export function contactsRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: contacts,
      entityType: "contact",
      permission: "clients",
      schema: contactSchema,
      searchColumns: [contacts.name, contacts.email, contacts.position],
      filters: { clientId: contacts.clientId },
      sortable: { name: contacts.name, createdAt: contacts.createdAt },
      defaultSort: { column: contacts.createdAt, dir: "desc" },
    }),
  );

  return router;
}
