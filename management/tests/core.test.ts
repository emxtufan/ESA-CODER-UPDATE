/**
 * Teste de integrare pe modulele de clienți și proiecte (§5, §6): slug generat și unic,
 * timeline pe client (schimbare de status), conflicte la ștergere/FK, ștergerea logică
 * și favoritele utilizatorului curent.
 *
 * Serverul rulează real, pe un port efemer, cu PGlite în memorie.
 */
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { projects } from "../server/db/schema/core";

import { setup, type Setup } from "./helpers";

let app: Setup;
/** Cookie-ul utilizatorului `super_admin` folosit de majoritatea cererilor. */
let cookie: string;

beforeEach(async () => {
  app = await setup();
  const admin = await app.makeUser("super_admin");
  cookie = await app.loginAs(admin);
});

afterEach(async () => {
  await app.close();
});

/** Client creat prin API; întoarce id-ul rândului nou. */
async function createClient(companyName = "Companie Test SRL"): Promise<string> {
  const result = await app.api("/api/clients", { method: "POST", body: { companyName }, cookie });
  expect(result.status).toBe(201);
  return result.json.item.id;
}

/** Proiect creat prin API (câmpurile minime obligatorii); întoarce rândul din răspuns. */
async function createProject(clientId: string, name = "Proiect Test"): Promise<any> {
  const result = await app.api("/api/projects", {
    method: "POST",
    body: { name, clientId, type: "Landing Page", status: "Planned", priority: "Medium" },
    cookie,
  });
  expect(result.status).toBe(201);
  return result.json.item;
}

describe("proiecte", () => {
  it("slug-ul se generează din nume, fără diacritice, și devine unic cu sufix", async () => {
    const clientId = await createClient();

    const first = await createProject(clientId, "Proiect Ștefan");
    expect(first.slug).toBe("proiect-stefan");

    const second = await createProject(clientId, "Proiect Ștefan");
    expect(second.slug).toBe("proiect-stefan-2");
  });

  it("un clientId inexistent dă 409 (referință invalidă)", async () => {
    const result = await app.api("/api/projects", {
      method: "POST",
      body: {
        name: "Proiect orfan",
        clientId: randomUUID(),
        type: "Landing Page",
        status: "Planned",
        priority: "Medium",
      },
      cookie,
    });

    expect(result.status).toBe(409);
  });

  it("lista întoarce numele clientului pe fiecare proiect", async () => {
    const companyName = "Nume Client SRL";
    const clientId = await createClient(companyName);
    await createProject(clientId, "Proiect cu client");

    const list = await app.api("/api/projects", { cookie });

    expect(list.status).toBe(200);
    expect(list.json.items[0].clientName).toBe(companyName);
  });

  it("PATCH cu doar numele nu modifică prioritatea", async () => {
    const clientId = await createClient();
    const project = await createProject(clientId);

    const patched = await app.api(`/api/projects/${project.id}`, {
      method: "PATCH",
      body: { name: "Proiect redenumit" },
      cookie,
    });

    expect(patched.status).toBe(200);
    expect(patched.json.item.name).toBe("Proiect redenumit");
    expect(patched.json.item.priority).toBe("Medium");

    const stored = await app.api(`/api/projects/${project.id}`, { cookie });
    expect(stored.json.item.priority).toBe("Medium");
  });

  it("ștergerea este logică: dispare din listă și primește deletedAt în DB", async () => {
    const clientId = await createClient();
    const project = await createProject(clientId);

    const deleted = await app.api(`/api/projects/${project.id}`, { method: "DELETE", cookie });
    expect(deleted.status).toBe(204);

    const list = await app.api("/api/projects", { cookie });
    expect(list.json.items.map((item: any) => item.id)).not.toContain(project.id);

    const [row] = await app.db.select().from(projects).where(eq(projects.id, project.id)).limit(1);
    expect(row).toBeDefined();
    expect(row.deletedAt).toBeInstanceOf(Date);
  });

  it("un proiect adăugat la favorite apare în /favorites/mine", async () => {
    const clientId = await createClient();
    const project = await createProject(clientId);

    const favorite = await app.api(`/api/projects/${project.id}/favorite`, {
      method: "POST",
      cookie,
    });
    expect(favorite.status).toBe(201);

    const mine = await app.api("/api/projects/favorites/mine", { cookie });
    expect(mine.status).toBe(200);
    expect(mine.json.items.map((item: any) => item.id)).toContain(project.id);
  });
});

describe("clienți", () => {
  it("sumarul clientului conține proiectul", async () => {
    const clientId = await createClient();
    const project = await createProject(clientId, "Proiect în sumar");

    const summary = await app.api(`/api/clients/${clientId}/summary`, { cookie });

    expect(summary.status).toBe(200);
    expect(summary.json.projects.map((item: any) => item.id)).toContain(project.id);
  });

  it("schimbarea statusului proiectului apare în recentActivity ca status_changed", async () => {
    const clientId = await createClient();
    const project = await createProject(clientId);

    const patched = await app.api(`/api/projects/${project.id}`, {
      method: "PATCH",
      body: { status: "Review" },
      cookie,
    });
    expect(patched.status).toBe(200);

    const summary = await app.api(`/api/clients/${clientId}/summary`, { cookie });
    expect(summary.status).toBe(200);

    const statusEntry = summary.json.recentActivity.find(
      (entry: any) => entry.type === "status_changed",
    );
    expect(statusEntry).toBeDefined();
    expect(statusEntry.description).toContain("Planned → Review");
  });

  it("ștergerea unui client cu proiecte active dă 409", async () => {
    const clientId = await createClient();
    await createProject(clientId);

    const deleted = await app.api(`/api/clients/${clientId}`, { method: "DELETE", cookie });

    expect(deleted.status).toBe(409);
  });

  it("un developer nu poate șterge un client (403)", async () => {
    const developer = await app.makeUser("developer");
    const developerCookie = await app.loginAs(developer);

    const clientId = await createClient();
    const deleted = await app.api(`/api/clients/${clientId}`, {
      method: "DELETE",
      cookie: developerCookie,
    });

    expect(deleted.status).toBe(403);
  });
});
