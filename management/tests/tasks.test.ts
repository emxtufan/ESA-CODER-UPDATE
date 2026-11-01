import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setup } from "./helpers";

type Setup = Awaited<ReturnType<typeof setup>>;

describe("tasks", () => {
  let ctx: Setup;
  let cookie: string;

  beforeEach(async () => {
    ctx = await setup();
    const user = await ctx.makeUser("administrator");
    cookie = await ctx.loginAs(user);
  });

  afterEach(async () => {
    await ctx.close();
  });

  async function newClient(companyName: string) {
    const res = await ctx.api("/api/clients", {
      method: "POST",
      body: { companyName },
      cookie,
    });
    expect(res.json.item).toBeTruthy();
    return res.json.item;
  }

  async function newProject(name: string) {
    const client = await newClient(`Client ${name}`);
    const res = await ctx.api("/api/projects", {
      method: "POST",
      body: {
        name,
        clientId: client.id,
        type: "Landing Page",
        status: "Planned",
        priority: "Medium",
      },
      cookie,
    });
    expect(res.json.item).toBeTruthy();
    return res.json.item;
  }

  async function newTask(
    projectId: string,
    title: string,
    extra: Record<string, any> = {},
  ) {
    const res = await ctx.api("/api/tasks", {
      method: "POST",
      body: { title, projectId, priority: "High", status: "To Do", ...extra },
      cookie,
    });
    expect(res.status).toBe(201);
    expect(res.json.item).toBeTruthy();
    return res.json.item;
  }

  it("returneaza numele proiectului in lista de task-uri", async () => {
    const project = await newProject("Proiect Lista");
    await newTask(project.id, "Task cu proiect");

    const res = await ctx.api("/api/tasks", { method: "GET", cookie });

    expect(res.status).toBe(200);
    expect(res.json.items[0].projectName).toBe(project.name);
  });

  it("seteaza completedAt la finalizare si il goleste la redeschidere", async () => {
    const project = await newProject("Proiect Completare");
    const task = await newTask(project.id, "Task de finalizat");

    const done = await ctx.api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: { status: "Completed" },
      cookie,
    });
    expect(done.status).toBe(200);
    expect(done.json.item.completedAt).not.toBeNull();
    expect(done.json.item.completedAt).toBeTruthy();

    const activities = await ctx.api(`/api/activities?projectId=${project.id}`, {
      method: "GET",
      cookie,
    });
    expect(activities.status).toBe(200);
    expect(
      activities.json.items.some((a: any) => a.type === "task_completed"),
    ).toBe(true);

    const reopened = await ctx.api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: { status: "To Do" },
      cookie,
    });
    expect(reopened.status).toBe(200);
    expect(reopened.json.item.completedAt).toBeNull();
  });

  it("gestioneaza dependentele dintre task-uri", async () => {
    const project = await newProject("Proiect Dependente");
    const a = await newTask(project.id, "Task A");
    const b = await newTask(project.id, "Task B");

    const created = await ctx.api(`/api/tasks/${a.id}/dependencies`, {
      method: "POST",
      body: { dependsOnId: b.id },
      cookie,
    });
    expect(created.status).toBe(201);

    const duplicate = await ctx.api(`/api/tasks/${a.id}/dependencies`, {
      method: "POST",
      body: { dependsOnId: b.id },
      cookie,
    });
    expect(duplicate.status).toBe(409);

    const cycle = await ctx.api(`/api/tasks/${b.id}/dependencies`, {
      method: "POST",
      body: { dependsOnId: a.id },
      cookie,
    });
    expect(cycle.status).toBe(422);

    const self = await ctx.api(`/api/tasks/${a.id}/dependencies`, {
      method: "POST",
      body: { dependsOnId: a.id },
      cookie,
    });
    expect(self.status).toBe(422);

    const removed = await ctx.api(`/api/tasks/${a.id}/dependencies/${b.id}`, {
      method: "DELETE",
      cookie,
    });
    expect(removed.status).toBe(204);
  });

  it("filtreaza calendarul dupa intervalul from/to", async () => {
    const project = await newProject("Proiect Calendar");
    const task = await newTask(project.id, "Task calendaristic", {
      due: "2030-05-15T10:00:00.000Z",
    });

    const inRange = await ctx.api(
      "/api/tasks/calendar?from=2030-05-01&to=2030-05-31",
      { method: "GET", cookie },
    );
    expect(inRange.status).toBe(200);
    expect(inRange.json.items.map((t: any) => t.id)).toContain(task.id);

    const outOfRange = await ctx.api(
      "/api/tasks/calendar?from=2030-06-01&to=2030-06-30",
      { method: "GET", cookie },
    );
    expect(outOfRange.status).toBe(200);
    expect(outOfRange.json.items.map((t: any) => t.id)).not.toContain(task.id);
  });

  it("converteste o observatie in task o singura data", async () => {
    const project = await newProject("Proiect Observatii");

    const observation = await ctx.api("/api/observations", {
      method: "POST",
      body: { title: "Observatie de convertit", projectId: project.id, priority: "Low" },
      cookie,
    });
    expect(observation.status).toBe(201);

    const converted = await ctx.api(
      `/api/observations/${observation.json.item.id}/convert`,
      { method: "POST", cookie },
    );
    expect(converted.status).toBe(201);
    expect(converted.json.item.status).toBe("To Do");

    const again = await ctx.api(
      `/api/observations/${observation.json.item.id}/convert`,
      { method: "POST", cookie },
    );
    expect(again.status).toBe(409);
  });

  it("creeaza comentarii si refuza stergerea de catre alt utilizator", async () => {
    const project = await newProject("Proiect Comentarii");
    const task = await newTask(project.id, "Task comentat");

    const created = await ctx.api("/api/comments", {
      method: "POST",
      body: { entityType: "task", entityId: task.id, body: "Comentariu de test" },
      cookie,
    });
    expect(created.status).toBe(201);

    const list = await ctx.api(
      `/api/comments?entityType=task&entityId=${task.id}`,
      { method: "GET", cookie },
    );
    expect(list.status).toBe(200);
    expect(list.json.items.map((c: any) => c.body)).toContain(
      "Comentariu de test",
    );

    const otherUser = await ctx.makeUser("administrator");
    const otherCookie = await ctx.loginAs(otherUser);

    const removed = await ctx.api(`/api/comments/${created.json.item.id}`, {
      method: "DELETE",
      cookie: otherCookie,
    });
    expect(removed.status).toBe(403);
  });

  it("adauga note in activities si nu permite PATCH pe ele", async () => {
    const project = await newProject("Proiect Note");

    const created = await ctx.api("/api/activities", {
      method: "POST",
      body: { projectId: project.id, description: "Nota manuala" },
      cookie,
    });
    expect(created.status).toBeGreaterThanOrEqual(200);
    expect(created.status).toBeLessThan(300);

    const list = await ctx.api(`/api/activities?projectId=${project.id}`, {
      method: "GET",
      cookie,
    });
    expect(list.status).toBe(200);
    expect(
      list.json.items.some(
        (a: any) => a.type === "note" && a.description === "Nota manuala",
      ),
    ).toBe(true);

    const patched = await ctx.api(
      `/api/activities/${created.json.item.id}`,
      { method: "PATCH", body: { description: "Altceva" }, cookie },
    );
    expect(patched.status).toBe(404);
  });

  it("cauta si grupeaza rezultatele pe tipuri", async () => {
    const unique = `CautareUnica${Date.now()}`;
    const project = await newProject(unique);
    await newTask(project.id, `${unique} task`);

    const res = await ctx.api(`/api/search?q=${encodeURIComponent(unique)}`, {
      method: "GET",
      cookie,
    });
    expect(res.status).toBe(200);
    const keys = res.json.groups.map((g: any) => g.key);
    expect(keys).toEqual(expect.arrayContaining(["clients", "projects", "tasks"]));

    const invalid = await ctx.api("/api/search?q=x", { method: "GET", cookie });
    expect(invalid.status).toBe(422);
  });
});
