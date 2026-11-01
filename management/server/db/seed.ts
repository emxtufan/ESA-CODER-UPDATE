/**
 * Seed pentru rolurile RBAC. Idempotent: se poate rula la fiecare pornire.
 * Rolurile de sistem existente nu sunt rescrise, în afară de `super_admin`,
 * care primește mereu toate permisiunile.
 */
import { eq } from "drizzle-orm";

import { ROLES, ROLE_LABELS } from "../../shared/enums";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../../shared/permissions";

import type { Db } from "./client";
import { roles } from "./schema/auth";

export async function seedRoles(db: Db): Promise<void> {
  await db
    .insert(roles)
    .values(
      ROLES.map((key) => ({
        key,
        name: ROLE_LABELS[key],
        permissions: [...DEFAULT_ROLE_PERMISSIONS[key]],
        isSystem: true,
      })),
    )
    .onConflictDoNothing();

  await db
    .update(roles)
    .set({ permissions: [...PERMISSIONS] })
    .where(eq(roles.key, "super_admin"));
}
