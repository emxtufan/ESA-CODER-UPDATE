/**
 * Creează primul cont `super_admin` (`npm run user:admin -- <email> <nume>`).
 * Parola e generată aleator și afișată o singură dată — în DB rămâne doar hash-ul.
 */
import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { roles, users } from "../db/schema/auth";
import { seedRoles } from "../db/seed";
import { loadEnv } from "../env";
import { hashPassword } from "../security/password";

/** 18 bytes aleatori → parolă base64url. */
const PASSWORD_BYTES = 18;

async function main(): Promise<void> {
  const [email, name] = process.argv.slice(2).map((value) => value.trim());

  if (!email || !name) {
    console.error("Utilizare: npm run user:admin -- <email> <nume>");
    process.exitCode = 1;
    return;
  }

  const env = loadEnv();
  const { db, close } = await createDb({ url: env.DATABASE_URL, dataDir: env.DATA_DIR });

  try {
    await seedRoles(db);

    const normalizedEmail = email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) throw new Error(`Există deja un utilizator cu emailul ${normalizedEmail}`);

    const [role] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, "super_admin"))
      .limit(1);

    if (!role) throw new Error("Rolul super_admin lipsește după seed");

    const password = randomBytes(PASSWORD_BYTES).toString("base64url");

    await db.insert(users).values({
      email: normalizedEmail,
      name,
      roleId: role.id,
      passwordHash: await hashPassword(password),
    });

    console.log(`Cont super_admin creat: ${normalizedEmail}`);
    console.log(`Parolă (se afișează o singură dată): ${password}`);
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.cause instanceof Error ? `${error.message}\n${error.cause.message}` : error.message) : String(error));
  process.exitCode = 1;
});
