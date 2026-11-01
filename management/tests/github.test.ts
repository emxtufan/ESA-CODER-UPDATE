import { createHmac, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { activities } from "../server/db/schema/core";
import { commits, deployments, pullRequests, releases, repositories } from "../server/db/schema/github";
import { setup, type Setup } from "./helpers";

let ctx: Setup;
let cookie: string;
let projectId: string;

function send(event: string, payload: unknown, opts: { delivery?: string; secret?: string } = {}) {
  const body = JSON.stringify(payload);
  const sig = `sha256=${createHmac("sha256", opts.secret ?? "test-secret").update(body).digest("hex")}`;
  return fetch(`${ctx.url}/api/webhooks/github`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": event,
      "x-github-delivery": opts.delivery ?? randomUUID(),
      "x-hub-signature-256": sig,
    },
    body,
  });
}

/** Repo nou, cu nume unic, ca testele să nu-și vadă rândurile unele altora. */
async function makeRepo(withProject = true) {
  const name = `site-${randomUUID().slice(0, 8)}`;
  const [repo] = await ctx.db
    .insert(repositories)
    .values({ owner: "Acme", name, projectId: withProject ? projectId : null })
    .returning();
  return { repo: repo!, repository: { full_name: `acme/${name}`.toLowerCase() } };
}

describe("github", () => {
  beforeAll(async () => {
    ctx = await setup();
    ctx.env.GITHUB_WEBHOOK_SECRET = "test-secret";
    const user = await ctx.makeUser("super_admin");
    cookie = await ctx.loginAs(user);
    const client = await ctx.api("/api/clients", { method: "POST", body: { companyName: "Acme" }, cookie });
    const project = await ctx.api("/api/projects", {
      method: "POST",
      body: { name: "Site", clientId: client.json.item.id, type: "Landing Page", status: "Planned", priority: "Medium" },
      cookie,
    });
    projectId = project.json.item.id;
  });
  afterAll(() => ctx.close());
  afterEach(() => vi.unstubAllGlobals());

  it("respinge semnătura greșită", async () => {
    const { repo, repository } = await makeRepo();
    const res = await send("push", { repository, ref: "refs/heads/main", commits: [{ id: "x1" }] }, { secret: "gresit" });
    expect(res.status).toBe(401);
    expect(await ctx.db.select().from(commits).where(eq(commits.repositoryId, repo.id))).toHaveLength(0);
  });

  it("întoarce 503 fără secret configurat", async () => {
    ctx.env.GITHUB_WEBHOOK_SECRET = undefined;
    try {
      expect((await send("ping", {})).status).toBe(503);
    } finally {
      ctx.env.GITHUB_WEBHOOK_SECRET = "test-secret";
    }
  });

  it("înregistrează commit-urile din push, o singură dată per livrare", async () => {
    const { repo, repository } = await makeRepo();
    const payload = {
      repository,
      ref: "refs/heads/main",
      commits: [
        { id: "aaa", message: "unu", author: { name: "A", email: "a@x.ro" }, added: ["f"], removed: [], modified: [], timestamp: "2026-01-01T10:00:00Z" },
        { id: "bbb", message: "doi", author: { name: "B" }, timestamp: "2026-01-01T11:00:00Z" },
      ],
    };
    const delivery = randomUUID();
    const first = await send("push", payload, { delivery });
    expect(await first.json()).toEqual({ duplicate: false, handled: true });
    const second = await send("push", payload, { delivery });
    expect(await second.json()).toEqual({ duplicate: true });
    const rows = await ctx.db.select().from(commits).where(eq(commits.repositoryId, repo.id));
    expect(rows).toHaveLength(2);
    expect(rows[0]!.branch).toBe("main");
    const log = await ctx.db.select().from(activities).where(eq(activities.entityId, repo.id));
    expect(log.filter((a) => a.type === "commit")).toHaveLength(1);
  });

  it("ignoră un repo necunoscut, fără să-l creeze", async () => {
    const before = await ctx.db.select().from(repositories);
    const res = await send("push", { repository: { full_name: "nimeni/nimic" }, ref: "refs/heads/main", commits: [{ id: "z" }] });
    expect(await res.json()).toEqual({ duplicate: false, handled: false });
    expect(await ctx.db.select().from(repositories)).toHaveLength(before.length);
  });

  it("actualizează același PR la fuziune", async () => {
    const { repo, repository } = await makeRepo();
    const pr = { number: 7, title: "T", user: { login: "dev" }, state: "open", created_at: "2026-01-01T10:00:00Z", head: { ref: "f" }, base: { ref: "main" } };
    await send("pull_request", { repository, action: "opened", pull_request: pr });
    await send("pull_request", { repository, action: "closed", pull_request: { ...pr, state: "closed", merged_at: "2026-01-02T10:00:00Z" } });
    const rows = await ctx.db.select().from(pullRequests).where(eq(pullRequests.repositoryId, repo.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("merged");
  });

  it("înregistrează doar release-urile publicate", async () => {
    const { repo, repository } = await makeRepo();
    await send("release", { repository, action: "created", release: { tag_name: "v0" } });
    await send("release", { repository, action: "published", release: { tag_name: "v1", name: "Unu", published_at: "2026-01-01T10:00:00Z" } });
    const rows = await ctx.db.select().from(releases).where(eq(releases.repositoryId, repo.id));
    expect(rows.map((r) => r.tag)).toEqual(["v1"]);
  });

  it("urmărește un deployment după id-ul GitHub", async () => {
    const { repo, repository } = await makeRepo();
    const deployment = { id: 9_000_000_001, sha: "abc", ref: "main", environment: "production", created_at: "2026-01-01T10:00:00Z" };
    await send("deployment", { repository, deployment });
    await send("deployment_status", { repository, deployment, deployment_status: { state: "success", environment_url: "https://x.ro" } });
    await send("deployment_status", { repository, deployment, deployment_status: { state: "inactive" } });
    const rows = await ctx.db.select().from(deployments).where(eq(deployments.repositoryId, repo.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("Successful");
    expect(rows[0]!.url).toBe("https://x.ro");
  });

  it("nu înregistrează deployment pentru repo fără proiect", async () => {
    const { repo, repository } = await makeRepo(false);
    const res = await send("deployment", { repository, deployment: { id: 9_000_000_002 } });
    expect(await res.json()).toEqual({ duplicate: false, handled: false });
    expect(await ctx.db.select().from(deployments).where(eq(deployments.repositoryId, repo.id))).toHaveLength(0);
  });

  it("sync fără token spune că GitHub nu e conectat", async () => {
    const { repo } = await makeRepo();
    const res = await ctx.api(`/api/github/repositories/${repo.id}/sync`, { method: "POST", cookie });
    expect(res.status).toBe(503);
    expect(res.json.error.code).toBe("github_not_configured");
  });

  it("sync aduce datele și marchează repo-ul conectat", async () => {
    const { repo } = await makeRepo();
    ctx.env.GITHUB_TOKEN = "tok-secret";
    const real = globalThis.fetch;
    const answers: Array<[string, unknown]> = [
      ["/commits", [{ sha: "c1", html_url: "https://g/c1", commit: { message: "m", author: { name: "A", email: "a@x", date: "2026-01-01T10:00:00Z" } } }]],
      ["/pulls", []],
      ["/releases", []],
    ];
    vi.stubGlobal("fetch", async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (!url.startsWith("https://api.github.com/")) return real(input, init);
      const hit = answers.find(([path]) => url.includes(path));
      const body = hit ? hit[1] : { default_branch: "main", html_url: "https://g/r", visibility: "private" };
      return new Response(JSON.stringify(body), { status: 200 });
    });
    try {
      const res = await ctx.api(`/api/github/repositories/${repo.id}/sync`, { method: "POST", cookie });
      expect(res.status).toBe(200);
      expect(await ctx.db.select().from(commits).where(eq(commits.repositoryId, repo.id))).toHaveLength(1);
      const [after] = await ctx.db.select().from(repositories).where(eq(repositories.id, repo.id));
      expect(after!.status).toBe("connected");
      expect(after!.lastSyncAt).not.toBeNull();
    } finally {
      ctx.env.GITHUB_TOKEN = undefined;
    }
  });

  it("status nu expune secretele", async () => {
    ctx.env.GITHUB_TOKEN = "tok-secret";
    try {
      const res = await ctx.api("/api/github/status", { cookie });
      expect(res.json).toEqual({ token: true, webhook: true });
      expect(JSON.stringify(res.json)).not.toContain("secret");
    } finally {
      ctx.env.GITHUB_TOKEN = undefined;
    }
  });

  it("commit-urile sunt doar pentru citire", async () => {
    const res = await ctx.api("/api/github/commits", { method: "POST", body: {}, cookie });
    expect(res.status).toBe(404);
  });

  it("deployment manual: rollback doar ca status, oră din formular, status validat", async () => {
    const ok = await ctx.api("/api/deployments", {
      method: "POST",
      body: { projectId, status: "Rolled Back", deployedAt: "2026-03-05T14:30" },
      cookie,
    });
    expect(ok.status).toBe(201);
    expect(ok.json.item.triggeredById).toBeTruthy();
    const bad = await ctx.api("/api/deployments", { method: "POST", body: { projectId, status: "Inventat" }, cookie });
    expect(bad.status).toBe(422);
  });
});
