/**
 * Rutele de infrastructură (§7): servere (plus proiectele în care sunt folosite),
 * servicii instalate, domenii, înregistrări DNS, certificate SSL și servicii de hosting.
 *
 * Toate CRUD-urile trec prin permisiunea `infrastructure`, listările aduc numele
 * proiectului/serverului/domeniului printr-un singur query pe pagina curentă, iar fiecare
 * scriere lasă o intrare `infra_changed` în timeline (când rândul are un `projectId`).
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { CURRENCIES, SERVER_PROVIDERS, SERVER_TYPES, SERVICE_NAMES } from "../../../shared/enums";
import { projects } from "../../db/schema/core";
import {
  dnsRecords,
  domains,
  hostingServices,
  projectServers,
  servers,
  serverServices,
  sslCertificates,
} from "../../db/schema/infra";
import { crudRouter, dateStr, moneyInt, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";

export { crudRouter };

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Adresă IP validă (v4 sau v6): string-ul gol devine `null`, câmpul absent rămâne `undefined`. */
const ipAddress = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.ipv4(), z.ipv6()]).nullable().optional(),
);

/** Port TCP opțional: `""` → `null`, restul coercit la întreg în intervalul valid. */
const portInt = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .coerce.number()
    .int("Port invalid")
    .min(1, "Port invalid")
    .max(65535, "Port invalid")
    .nullable()
    .optional(),
);

/** TTL DNS opțional (secunde): `""` → `null`. */
const ttlInt = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .coerce.number()
    .int("TTL invalid")
    .min(0, "TTL invalid")
    .max(2147483647, "TTL invalid")
    .nullable()
    .optional(),
);

/** Moment ISO opțional (formularul trimite string): `""` → `null`. */
const dateTime = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.date().nullable().optional(),
);

/** Câmpurile serverului din §7; `ip` e singurul câmp care nu e text liber. */
const serverSchema = z.object({
  name: z.string().trim().min(1, "Numele serverului este obligatoriu").max(200),
  provider: z.enum(SERVER_PROVIDERS),
  ip: ipAddress,
  os: optStr,
  type: z.enum(SERVER_TYPES),
  sshPort: portInt,
  sshUsername: optStr,
  sshKeyRef: optStr,
  location: optStr,
  cpu: optStr,
  ram: optStr,
  disk: optStr,
  status: optStr,
  purchaseDate: dateStr,
  renewalDate: dateStr,
  monthlyCost: moneyInt.nullable().optional(),
  currency: z.enum(CURRENCIES).nullable().optional(),
  notes: optStr,
});

/** Serviciul instalat pe un server (§7). */
const serviceSchema = z.object({
  serverId: z.uuid("Identificator invalid"),
  name: z.enum(SERVICE_NAMES),
  version: optStr,
  port: portInt,
  status: optStr,
  configPath: optStr,
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  notes: optStr,
});

/** Domeniul (§7), cu nume unic în DB. */
const domainSchema = z.object({
  domain: z.string().trim().min(1, "Domeniul este obligatoriu").max(253),
  registrar: optStr,
  registrationDate: dateStr,
  expirationDate: dateStr,
  autoRenewal: z.boolean().optional(),
  dnsProvider: optStr,
  nameservers: z.array(z.string().trim().min(1)).optional(),
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  renewalCost: moneyInt.nullable().optional(),
  currency: z.enum(CURRENCIES).nullable().optional(),
  status: optStr,
});

/** Înregistrarea DNS: tipul rămâne text liber (A, AAAA, CNAME, MX, TXT, …). */
const dnsSchema = z.object({
  domainId: z.uuid("Identificator invalid"),
  type: z.string().trim().min(1, "Tipul este obligatoriu").max(20),
  name: z.string().trim().min(1, "Numele este obligatoriu").max(255),
  value: z.string().trim().min(1, "Valoarea este obligatorie").max(2000),
  ttl: ttlInt,
});

/** Certificatul SSL al unui domeniu (§7). */
const sslSchema = z.object({
  domainId: z.uuid("Identificator invalid"),
  issuer: optStr,
  issueDate: dateStr,
  expirationDate: dateStr,
  autoRenewal: z.boolean().optional(),
  status: optStr,
  lastCheckedAt: dateTime,
});

/** Serviciul de hosting (§7), legat opțional de un proiect. */
const hostingSchema = z.object({
  provider: z.string().trim().min(1, "Furnizorul este obligatoriu").max(100),
  plan: optStr,
  monthlyCost: moneyInt.nullable().optional(),
  currency: z.enum(CURRENCIES).nullable().optional(),
  billingCycle: optStr,
  nextPaymentDate: dateStr,
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  paymentStatus: optStr,
});

/** Lista de proiecte a unui server: se înlocuiește în întregime. */
const serverProjectsSchema = z.object({
  projectIds: z.array(z.uuid("Identificator invalid")),
});

/** Serverul după id, doar dacă nu e șters logic (altfel 404). */
async function findServer(req: Request, id: string): Promise<any> {
  const [row] = await req.ctx.db
    .select()
    .from(servers)
    .where(and(eq(servers.id, id), isNull(servers.deletedAt)))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Serverul nu există");
  return row;
}

/** Intrarea de timeline a unei scrieri din infrastructură (`projectId` doar dacă există). */
async function infraActivity(
  req: Request,
  entityType: string,
  row: any,
  description: string,
): Promise<void> {
  await recordActivity(req.ctx.db, {
    projectId: row.projectId ?? null,
    actorId: req.auth?.user.id ?? null,
    type: "infra_changed",
    description,
    entityType,
    entityId: row.id,
  });
}

/** Id-urile nenule (fără duplicate) de pe o coloană a paginii curente. */
function uniqueIds(rows: any[], key: string): string[] {
  const values = rows.map((row) => row[key] as string | null);
  return [...new Set(values.filter((id): id is string => Boolean(id)))];
}

/** Adaugă `projectName` rândurilor paginii, printr-un singur query. */
async function attachProjectNames(rows: any[], req: Request): Promise<any[]> {
  const ids = uniqueIds(rows, "projectId");
  if (ids.length === 0) return rows.map((row) => ({ ...row, projectName: null }));

  const projectRows = await req.ctx.db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(inArray(projects.id, ids));
  const names = new Map(projectRows.map((row) => [row.id, row.name]));

  return rows.map((row) => ({
    ...row,
    projectName: row.projectId ? (names.get(row.projectId) ?? null) : null,
  }));
}

/** Serviciile primesc și numele serverului, pe lângă cel al proiectului. */
async function attachServiceNames(rows: any[], req: Request): Promise<any[]> {
  const withProjects = await attachProjectNames(rows, req);
  const ids = uniqueIds(rows, "serverId");
  if (ids.length === 0) return withProjects.map((row) => ({ ...row, serverName: null }));

  const serverRows = await req.ctx.db
    .select({ id: servers.id, name: servers.name })
    .from(servers)
    .where(inArray(servers.id, ids));
  const names = new Map(serverRows.map((row) => [row.id, row.name]));

  return withProjects.map((row) => ({ ...row, serverName: names.get(row.serverId) ?? null }));
}

/** Certificatele SSL primesc numele domeniului (`domainId` → `domainName`). */
async function attachDomainNames(rows: any[], req: Request): Promise<any[]> {
  const ids = uniqueIds(rows, "domainId");
  if (ids.length === 0) return rows.map((row) => ({ ...row, domainName: null }));

  const domainRows = await req.ctx.db
    .select({ id: domains.id, domain: domains.domain })
    .from(domains)
    .where(inArray(domains.id, ids));
  const names = new Map(domainRows.map((row) => [row.id, row.domain]));

  return rows.map((row) => ({ ...row, domainName: names.get(row.domainId) ?? null }));
}

export function serversRouter(): Router {
  const router = Router();

  // Sub-rutele proprii stau înainte de `crudRouter`, ca `/…/projects` să nu ajungă la `/:id`.

  /** Proiectele în care e folosit serverul. */
  router.get("/:id/projects", requirePermission("infrastructure.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    await findServer(req, id);

    const items = await req.ctx.db
      .select({ id: projects.id, name: projects.name })
      .from(projectServers)
      .innerJoin(projects, eq(projects.id, projectServers.projectId))
      .where(eq(projectServers.serverId, id))
      .orderBy(asc(projects.name));

    res.json({ items });
  });

  /** Înlocuiește lista de proiecte a serverului (idempotent). */
  router.put("/:id/projects", requirePermission("infrastructure.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const { projectIds } = parse(serverProjectsSchema, req.body);
    await findServer(req, id);

    const { db } = req.ctx;
    const unique = [...new Set(projectIds)];

    if (unique.length > 0) {
      const existing = await db
        .select({ id: projects.id })
        .from(projects)
        .where(inArray(projects.id, unique));
      if (existing.length !== unique.length) {
        throw new HttpError(422, "validation_error", "Unul dintre proiecte nu există");
      }
    }

    await db.delete(projectServers).where(eq(projectServers.serverId, id));
    if (unique.length > 0) {
      await db.insert(projectServers).values(unique.map((projectId) => ({ projectId, serverId: id })));
    }

    const items = await db
      .select({ id: projects.id, name: projects.name })
      .from(projectServers)
      .innerJoin(projects, eq(projects.id, projectServers.projectId))
      .where(eq(projectServers.serverId, id))
      .orderBy(asc(projects.name));

    res.json({ items });
  });

  router.use(
    crudRouter({
      table: servers,
      entityType: "server",
      permission: "infrastructure",
      schema: serverSchema,
      searchColumns: [servers.name, servers.ip],
      filters: {
        provider: servers.provider,
        type: servers.type,
        status: servers.status,
        renewalDate: servers.renewalDate,
      },
      sortable: {
        name: servers.name,
        ip: servers.ip,
        provider: servers.provider,
        type: servers.type,
        status: servers.status,
        renewalDate: servers.renewalDate,
      },
      defaultSort: { column: servers.name },
      // Filtrarea pe proiect: doar serverele legate în `project_servers` de acel proiect.
      scope: (req: Request) => {
        const raw = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
        if (!raw) return undefined;

        const parsed = z.uuid().safeParse(raw);
        if (!parsed.success) {
          throw new HttpError(422, "validation_error", "Identificator de proiect invalid");
        }

        return inArray(
          servers.id,
          req.ctx.db
            .select({ serverId: projectServers.serverId })
            .from(projectServers)
            .where(eq(projectServers.projectId, parsed.data)),
        );
      },
      afterCreate: async (row: any, req: Request) => {
        await infraActivity(req, "server", row, `Server adăugat: ${row.name}`);
      },
      afterUpdate: async (row: any, req: Request) => {
        await infraActivity(req, "server", row, `Server actualizat: ${row.name}`);
      },
    }),
  );

  return router;
}

export function servicesRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: serverServices,
      entityType: "service",
      permission: "infrastructure",
      schema: serviceSchema,
      searchColumns: [serverServices.name, serverServices.version, serverServices.status],
      filters: {
        name: serverServices.name,
        status: serverServices.status,
        serverId: serverServices.serverId,
        projectId: serverServices.projectId,
      },
      sortable: {
        name: serverServices.name,
        status: serverServices.status,
        serverId: serverServices.serverId,
        projectId: serverServices.projectId,
      },
      defaultSort: { column: serverServices.name },
      listTransform: attachServiceNames,
      afterCreate: async (row: any, req: Request) => {
        await infraActivity(req, "service", row, `Serviciu instalat: ${row.name}`);
      },
      afterUpdate: async (row: any, req: Request) => {
        await infraActivity(req, "service", row, `Serviciu actualizat: ${row.name}`);
      },
    }),
  );

  return router;
}

export function domainsRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: domains,
      entityType: "domain",
      permission: "infrastructure",
      schema: domainSchema,
      searchColumns: [domains.domain, domains.registrar, domains.dnsProvider],
      filters: {
        registrar: domains.registrar,
        status: domains.status,
        expirationDate: domains.expirationDate,
        projectId: domains.projectId,
      },
      sortable: {
        domain: domains.domain,
        registrar: domains.registrar,
        status: domains.status,
        expirationDate: domains.expirationDate,
        projectId: domains.projectId,
      },
      defaultSort: { column: domains.domain },
      listTransform: attachProjectNames,
      afterCreate: async (row: any, req: Request) => {
        await infraActivity(req, "domain", row, `Domeniu adăugat: ${row.domain}`);
      },
      afterUpdate: async (row: any, req: Request) => {
        await infraActivity(req, "domain", row, `Domeniu actualizat: ${row.domain}`);
      },
    }),
  );

  return router;
}

export function dnsRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: dnsRecords,
      entityType: "dns_record",
      permission: "infrastructure",
      schema: dnsSchema,
      searchColumns: [dnsRecords.name, dnsRecords.value],
      filters: {
        domainId: dnsRecords.domainId,
        type: dnsRecords.type,
      },
      sortable: {
        domainId: dnsRecords.domainId,
        type: dnsRecords.type,
        name: dnsRecords.name,
      },
      defaultSort: { column: dnsRecords.name },
      afterCreate: async (row: any, req: Request) => {
        await infraActivity(req, "dns_record", row, `Înregistrare DNS: ${row.type} ${row.name}`);
      },
      afterUpdate: async (row: any, req: Request) => {
        await infraActivity(
          req,
          "dns_record",
          row,
          `Înregistrare DNS actualizată: ${row.type} ${row.name}`,
        );
      },
    }),
  );

  return router;
}

export function sslRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: sslCertificates,
      entityType: "ssl_certificate",
      permission: "infrastructure",
      schema: sslSchema,
      searchColumns: [sslCertificates.issuer, sslCertificates.status],
      filters: {
        domainId: sslCertificates.domainId,
        issuer: sslCertificates.issuer,
        status: sslCertificates.status,
        expirationDate: sslCertificates.expirationDate,
      },
      sortable: {
        domainId: sslCertificates.domainId,
        issuer: sslCertificates.issuer,
        status: sslCertificates.status,
        expirationDate: sslCertificates.expirationDate,
      },
      defaultSort: { column: sslCertificates.expirationDate },
      listTransform: attachDomainNames,
      afterCreate: async (row: any, req: Request) => {
        await infraActivity(
          req,
          "ssl_certificate",
          row,
          `Certificat SSL: ${row.issuer ?? "fără emitent"}`,
        );
      },
      afterUpdate: async (row: any, req: Request) => {
        await infraActivity(
          req,
          "ssl_certificate",
          row,
          `Certificat SSL actualizat: ${row.issuer ?? "fără emitent"}`,
        );
      },
    }),
  );

  return router;
}

export function hostingRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: hostingServices,
      entityType: "hosting",
      permission: "infrastructure",
      schema: hostingSchema,
      searchColumns: [hostingServices.provider, hostingServices.plan],
      filters: {
        provider: hostingServices.provider,
        plan: hostingServices.plan,
        nextPaymentDate: hostingServices.nextPaymentDate,
        projectId: hostingServices.projectId,
      },
      sortable: {
        provider: hostingServices.provider,
        plan: hostingServices.plan,
        nextPaymentDate: hostingServices.nextPaymentDate,
        projectId: hostingServices.projectId,
      },
      defaultSort: { column: hostingServices.provider },
      listTransform: attachProjectNames,
      afterCreate: async (row: any, req: Request) => {
        await infraActivity(req, "hosting", row, `Hosting: ${hostingLabel(row)}`);
      },
      afterUpdate: async (row: any, req: Request) => {
        await infraActivity(req, "hosting", row, `Hosting actualizat: ${hostingLabel(row)}`);
      },
    }),
  );

  return router;
}
