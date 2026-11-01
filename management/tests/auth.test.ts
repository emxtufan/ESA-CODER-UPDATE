/**
 * Teste de integrare pe autentificare, al doilea factor, sesiuni, parole și RBAC.
 * Serverul rulează real, pe un port efemer, cu PGlite în memorie.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { auditLogs, passwordTokens, roles, users } from "../server/db/schema/auth";
import { hotp } from "../server/security/totp";

import { setup, TEST_PASSWORD, type Setup } from "./helpers";

/** Pasul TOTP curent (30s) — ca în `totp.ts`. */
const STEP_SECONDS = 30;

/** Decodează base32 (secretul TOTP vine base32 din API). */
function base32Decode(secret: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of secret.toUpperCase().replace(/[\s=]/g, "")) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error(`Caracter base32 invalid: ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function currentStep(): number {
  return Math.floor(Date.now() / 1000 / STEP_SECONDS);
}

function codeFor(secret: string, step: number): string {
  return hotp(base32Decode(secret), step);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

let app: Setup;

beforeEach(async () => {
  app = await setup();
});

afterEach(async () => {
  await app.close();
});

describe("login", () => {
  it("login cu parolă corectă întoarce utilizatorul și cookie de sesiune", async () => {
    const user = await app.makeUser("administrator");

    const result = await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: user.password },
    });

    expect(result.status).toBe(200);
    expect(result.json.user.email).toBe(user.email);
    expect(result.json.user.role).toBe("administrator");
    expect(result.setCookie).toBeTruthy();
    expect(result.setCookie?.startsWith("esa_mgmt=")).toBe(true);
  });

  it("parolă greșită → 401 invalid_credentials", async () => {
    const user = await app.makeUser("administrator");

    const result = await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: "Parola-gresita-1" },
    });

    expect(result.status).toBe(401);
    expect(result.json.error.code).toBe("invalid_credentials");
    expect(result.setCookie).toBeUndefined();
  });

  it("rate limiting: a 11-a încercare → 429", async () => {
    const user = await app.makeUser("developer");

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const result = await app.api("/api/auth/login", {
        method: "POST",
        body: { email: user.email, password: "Parola-gresita-1" },
      });
      expect(result.status).toBe(401);
    }

    const limited = await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: "Parola-gresita-1" },
    });

    expect(limited.status).toBe(429);
    expect(limited.json.error.code).toBe("rate_limited");
  });

  it("/me fără sesiune → 401 unauthorized", async () => {
    const result = await app.api("/api/auth/me");

    expect(result.status).toBe(401);
    expect(result.json.error.code).toBe("unauthorized");
  });

  it("logout invalidează sesiunea", async () => {
    const user = await app.makeUser("administrator");
    const cookie = await app.loginAs(user);

    const logout = await app.api("/api/auth/logout", { method: "POST", cookie });
    expect(logout.status).toBe(200);

    const me = await app.api("/api/auth/me", { cookie });
    expect(me.status).toBe(401);
  });

  it("CSRF: POST fără header-ul x-requested-with → 403", async () => {
    const response = await fetch(`${app.url}/api/auth/logout`, { method: "POST" });
    const json = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(json.error.code).toBe("csrf_failed");
  });
});

describe("al doilea factor (TOTP)", () => {
  it("setup + enable + login cu mfa, cod bun, refolosire respinsă", async () => {
    const user = await app.makeUser("administrator");
    const cookie = await app.loginAs(user);

    const setupResult = await app.api("/api/auth/2fa/setup", {
      method: "POST",
      body: { password: TEST_PASSWORD },
      cookie,
    });
    expect(setupResult.status).toBe(200);
    const secret: string = setupResult.json.secret;
    expect(typeof secret).toBe("string");

    const enableStep = currentStep();
    const enable = await app.api("/api/auth/2fa/enable", {
      method: "POST",
      body: { code: codeFor(secret, enableStep) },
      cookie,
    });
    expect(enable.status).toBe(200);
    expect(enable.json.totpEnabled).toBe(true);

    // Login cere acum al doilea pas; sesiunea rămâne `mfaPending`.
    const login = await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: user.password },
    });
    expect(login.status).toBe(200);
    expect(login.json.mfaRequired).toBe(true);
    const pendingCookie = login.setCookie;
    expect(pendingCookie).toBeTruthy();

    const pendingMe = await app.api("/api/auth/me", { cookie: pendingCookie });
    expect(pendingMe.status).toBe(401);
    expect(pendingMe.json.error.code).toBe("mfa_required");

    // Un pas nou (anti-replay: pasul de la enable e deja consumat).
    const verifyStep = currentStep() + 1;
    const verify = await app.api("/api/auth/2fa/verify", {
      method: "POST",
      body: { code: codeFor(secret, verifyStep) },
      cookie: pendingCookie,
    });
    expect(verify.status).toBe(200);
    expect(verify.json.user.email).toBe(user.email);

    const fullCookie = verify.setCookie;
    expect(fullCookie).toBeTruthy();
    expect((await app.api("/api/auth/me", { cookie: fullCookie })).status).toBe(200);

    // Același cod, refolosit → respins.
    const replay = await app.api("/api/auth/2fa/verify", {
      method: "POST",
      body: { code: codeFor(secret, verifyStep) },
      cookie: fullCookie,
    });
    expect(replay.status).toBe(401);
    expect(replay.json.error.code).toBe("invalid_code");
  });
});

describe("sesiuni", () => {
  it("revocarea unei sesiuni o invalidează imediat", async () => {
    const user = await app.makeUser("developer");
    const first = await app.loginAs(user);
    const second = await app.loginAs(user);

    const list = await app.api("/api/auth/sessions", { cookie: first });
    expect(list.status).toBe(200);
    const other = (list.json.items as { id: string; current: boolean }[]).find((item) => !item.current);
    expect(other).toBeTruthy();

    const revoked = await app.api(`/api/auth/sessions/${other!.id}`, { method: "DELETE", cookie: first });
    expect(revoked.status).toBe(200);

    expect((await app.api("/api/auth/me", { cookie: second })).status).toBe(401);
    expect((await app.api("/api/auth/me", { cookie: first })).status).toBe(200);
  });

  it("change-password revocă celelalte sesiuni, nu și pe cea curentă", async () => {
    const user = await app.makeUser("administrator");
    const current = await app.loginAs(user);
    const other = await app.loginAs(user);
    const nextPassword = "Parola-noua-456";

    const changed = await app.api("/api/auth/change-password", {
      method: "POST",
      body: { current: TEST_PASSWORD, next: nextPassword },
      cookie: current,
    });
    expect(changed.status).toBe(200);

    expect((await app.api("/api/auth/me", { cookie: other })).status).toBe(401);
    expect((await app.api("/api/auth/me", { cookie: current })).status).toBe(200);

    const loginWithNew = await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: nextPassword },
    });
    expect(loginWithNew.status).toBe(200);
  });
});

describe("parolă uitată și resetare", () => {
  it("forgot-password → 202, apoi reset cu token inserat direct", async () => {
    const user = await app.makeUser("finance");

    const forgot = await app.api("/api/auth/forgot-password", {
      method: "POST",
      body: { email: user.email },
    });
    expect(forgot.status).toBe(202);

    // Tokenul din email nu poate fi citit: îl simulăm inserând hash-ul unui token cunoscut.
    const token = randomBytes(32).toString("base64url");
    await app.db.insert(passwordTokens).values({
      tokenHash: sha256(token),
      userId: user.id,
      kind: "reset",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const nextPassword = "Parola-reset-789";
    const reset = await app.api("/api/auth/reset-password", {
      method: "POST",
      body: { token, password: nextPassword },
    });
    expect(reset.status).toBe(200);

    const login = await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: nextPassword },
    });
    expect(login.status).toBe(200);

    // Tokenul e consumat: a doua folosire e refuzată.
    const reuse = await app.api("/api/auth/reset-password", {
      method: "POST",
      body: { token, password: "Parola-reset-000" },
    });
    expect(reuse.status).toBe(400);
    expect(reuse.json.error.code).toBe("invalid_token");
  });
});

describe("RBAC", () => {
  it("developer pe GET /api/users → 403, super_admin → 200", async () => {
    const developer = await app.makeUser("developer");
    const developerCookie = await app.loginAs(developer);

    const denied = await app.api("/api/users", { cookie: developerCookie });
    expect(denied.status).toBe(403);
    expect(denied.json.error.code).toBe("forbidden");

    const root = await app.makeUser("super_admin");
    const rootCookie = await app.loginAs(root);

    const allowed = await app.api("/api/users", { cookie: rootCookie });
    expect(allowed.status).toBe(200);
  });

  it("client pe GET /api/audit → 403", async () => {
    const client = await app.makeUser("client");
    const cookie = await app.loginAs(client);

    const denied = await app.api("/api/audit", { cookie });
    expect(denied.status).toBe(403);
    expect(denied.json.error.code).toBe("forbidden");
  });

  it("administratorul nu poate invita un super_admin → 403", async () => {
    const admin = await app.makeUser("administrator");
    const cookie = await app.loginAs(admin);

    const invitedEmail = `invitat-${randomUUID()}@test.local`;
    const denied = await app.api("/api/users/invite", {
      method: "POST",
      body: { email: invitedEmail, name: "Invitat", role: "super_admin", roleKey: "super_admin" },
      cookie,
    });
    expect(denied.status).toBe(403);

    // Niciun utilizator nou nu a fost creat.
    const [created] = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, invitedEmail));
    expect(created).toBeUndefined();
  });

  it("rolul super_admin nu poate fi modificat prin PATCH", async () => {
    const root = await app.makeUser("super_admin");
    const cookie = await app.loginAs(root);

    const denied = await app.api("/api/users/roles/super_admin", {
      method: "PATCH",
      body: { permissions: [] },
      cookie,
    });
    expect(denied.status).toBe(403);

    const [role] = await app.db
      .select({ permissions: roles.permissions })
      .from(roles)
      .where(eq(roles.key, "super_admin"))
      .limit(1);
    expect(role.permissions).toContain("users.update");
  });

  it("ultimul super_admin nu poate fi retrogradat", async () => {
    const root = await app.makeUser("super_admin");
    const cookie = await app.loginAs(root);

    const demote = await app.api(`/api/users/${root.id}`, {
      method: "PATCH",
      body: { role: "developer", roleKey: "developer" },
      cookie,
    });
    expect([400, 403, 409]).toContain(demote.status);

    const [row] = await app.db
      .select({ roleKey: roles.key })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(eq(users.id, root.id))
      .limit(1);
    expect(row.roleKey).toBe("super_admin");
  });
});

describe("audit", () => {
  it("audit_logs nu conține parole în meta", async () => {
    const user = await app.makeUser("administrator");
    const cookie = await app.loginAs(user);

    // Acțiuni care trec parola prin request.
    await app.api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: "Parola-gresita-1" },
    });
    const nextPassword = "Parola-schimbata-1";
    await app.api("/api/auth/change-password", {
      method: "POST",
      body: { current: TEST_PASSWORD, next: nextPassword },
      cookie,
    });

    const rows = await app.db.select({ meta: auditLogs.meta }).from(auditLogs);
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const serialized = JSON.stringify(row.meta ?? {});
      expect(serialized).not.toContain(TEST_PASSWORD);
      expect(serialized).not.toContain(nextPassword);
      expect(serialized).not.toContain("Parola-gresita-1");

      const meta = (row.meta ?? {}) as Record<string, unknown>;
      if ("password" in meta) expect(meta.password).toBe("[redacted]");
    }
  });
});
