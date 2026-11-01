import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, desc } from "drizzle-orm";
import { setup } from "./helpers";
import { credentials } from "../server/db/schema/infra";
import { auditLogs } from "../server/db/schema/auth";

const MASTER_SECRET = "s3cret-valoare";

describe("/api/vault", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  beforeAll(async () => {
    ctx = await setup();
  });

  afterAll(async () => {
    await ctx.close();
  });

  async function createCredential(cookie: string, overrides: Partial<Record<string, unknown>> = {}) {
    const res = await ctx.api("/api/vault", {
      method: "POST",
      cookie,
      body: {
        name: "SSH prod",
        type: "SSH",
        username: "root",
        secret: MASTER_SECRET,
        ...overrides,
      },
    });
    expect(res.status).toBe(201);
    return res.json.item as Record<string, any>;
  }

  function assertNoSecret(payload: unknown) {
    const raw = JSON.stringify(payload);
    expect(raw).not.toContain(MASTER_SECRET);
    expect(raw).not.toContain("secretEnc");
  }

  it("nu expune secretul în POST, GET listă și GET /:id", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);

    const post = await ctx.api("/api/vault", {
      method: "POST",
      cookie,
      body: {
        name: "SSH prod",
        type: "SSH",
        username: "root",
        secret: MASTER_SECRET,
      },
    });
    expect(post.status).toBe(201);
    expect(post.json.item).toBeTruthy();
    expect(post.json.item.secret).toBeUndefined();
    expect(post.json.item.secretEnc).toBeUndefined();
    assertNoSecret(post.json);

    const item = post.json.item as Record<string, any>;

    const list = await ctx.api("/api/vault", { method: "GET", cookie });
    expect(list.status).toBe(200);
    assertNoSecret(list.json);

    const single = await ctx.api(`/api/vault/${item.id}`, { method: "GET", cookie });
    expect(single.status).toBe(200);
    assertNoSecret(single.json);
  });

  it("stochează secretEnc versionat, fără secret în clar", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);
    const item = await createCredential(cookie);

    const [row] = await ctx.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, item.id));

    expect(row).toBeTruthy();
    expect(row.secretEnc.startsWith("v1.")).toBe(true);
    expect(row.secretEnc).not.toContain(MASTER_SECRET);
  });

  it("refuză reveal cu parolă greșită și auditează", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);
    const item = await createCredential(cookie);

    const res = await ctx.api(`/api/vault/${item.id}/reveal`, {
      method: "POST",
      cookie,
      body: { password: "parola-gresita-000" },
    });
    expect(res.status).toBe(401);

    const logs = await ctx.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "credential_reveal_denied"))
      .orderBy(desc(auditLogs.at));
    expect(logs.length).toBeGreaterThan(0);
  });

  it("permite reveal cu parolă corectă fără a scrie secretul în audit", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);
    const item = await createCredential(cookie);

    const res = await ctx.api(`/api/vault/${item.id}/reveal`, {
      method: "POST",
      cookie,
      body: { password: "parola-test-sigura-123" },
    });
    expect(res.status).toBe(200);
    expect(res.json.secret).toBe(MASTER_SECRET);

    const logs = await ctx.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "credential_revealed"))
      .orderBy(desc(auditLogs.at));
    expect(logs.length).toBeGreaterThan(0);

    const metas = JSON.stringify(logs.map((l) => l.meta));
    expect(metas).not.toContain(MASTER_SECRET);
  });

  it("limitează încercările greșite de reveal (429)", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);
    const item = await createCredential(cookie);

    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await ctx.api(`/api/vault/${item.id}/reveal`, {
        method: "POST",
        cookie,
        body: { password: "parola-gresita-000" },
      });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("refuză reveal pe credential revocat (409)", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);
    const item = await createCredential(cookie);

    const revoke = await ctx.api(`/api/vault/${item.id}/revoke`, {
      method: "POST",
      cookie,
    });
    expect(revoke.status).toBeLessThan(300);

    const reveal = await ctx.api(`/api/vault/${item.id}/reveal`, {
      method: "POST",
      cookie,
      body: { password: "parola-test-sigura-123" },
    });
    expect(reveal.status).toBe(409);
  });

  it("rotește secretul", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);
    const item = await createCredential(cookie);

    const [before] = await ctx.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, item.id));

    const rotate = await ctx.api(`/api/vault/${item.id}/rotate`, {
      method: "POST",
      cookie,
      body: { secret: "nou-secret", password: "parola-test-sigura-123" },
    });
    expect(rotate.status).toBeGreaterThanOrEqual(200);
    expect(rotate.status).toBeLessThan(300);

    const [after] = await ctx.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, item.id));
    expect(after.secretEnc).not.toBe(before.secretEnc);

    const reveal = await ctx.api(`/api/vault/${item.id}/reveal`, {
      method: "POST",
      cookie,
      body: { password: "parola-test-sigura-123" },
    });
    expect(reveal.status).toBe(200);
    expect(reveal.json.secret).toBe("nou-secret");
  });

  it("interzice accesul pentru rolul finance", async () => {
    const admin = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const adminCookie = await ctx.loginAs(admin);
    const item = await createCredential(adminCookie);

    const finance = await ctx.makeUser("finance", { password: "parola-test-sigura-123" });
    const financeCookie = await ctx.loginAs(finance);

    const reveal = await ctx.api(`/api/vault/${item.id}/reveal`, {
      method: "POST",
      cookie: financeCookie,
      body: { password: "parola-test-sigura-123" },
    });
    expect(reveal.status).toBe(403);

    const get = await ctx.api(`/api/vault/${item.id}`, {
      method: "GET",
      cookie: financeCookie,
    });
    expect(get.status).toBe(403);
  });

  it("leagă blob-ul criptat de credențială prin AAD", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);

    const a = await createCredential(cookie, { name: "SSH A", username: "root" });
    const b = await createCredential(cookie, { name: "SSH B", username: "root" });

    const [rowA] = await ctx.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, a.id));

    await ctx.db
      .update(credentials)
      .set({ secretEnc: rowA.secretEnc })
      .where(eq(credentials.id, b.id));

    const reveal = await ctx.api(`/api/vault/${b.id}/reveal`, {
      method: "POST",
      cookie,
      body: { password: "parola-test-sigura-123" },
    });

    expect(reveal.status).toBeGreaterThanOrEqual(400);
    const raw = JSON.stringify(reveal.json ?? {});
    expect(raw).not.toContain(MASTER_SECRET);
    expect(reveal.json?.secret).not.toBe(MASTER_SECRET);
  });

  it("returnează 503 când lipsește VAULT_MASTER_KEY", async () => {
    const user = await ctx.makeUser("super_admin", { password: "parola-test-sigura-123" });
    const cookie = await ctx.loginAs(user);

    const original = ctx.env.VAULT_MASTER_KEY;
    try {
      ctx.env.VAULT_MASTER_KEY = undefined;

      const res = await ctx.api("/api/vault", {
        method: "POST",
        cookie,
        body: {
          name: "SSH prod",
          type: "SSH",
          username: "root",
          secret: MASTER_SECRET,
        },
      });
      expect(res.status).toBe(503);
    } finally {
      ctx.env.VAULT_MASTER_KEY = original;
    }
  });
});
