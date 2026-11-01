import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { monitoringChecks } from "../db/schema/ops";
import type { Env } from "../env";
import { runCheck } from "../modules/monitoring/check";
import { retryFailed } from "../modules/notifications/service";
import { runDailyChecks } from "./daily";

const TICK_MS = 60_000;
const DAILY_EVERY_MS = 3_600_000;
const MAX_CHECKS_PER_TICK = 20;

/** Verificările ajunse la termen, cele mai vechi primele. */
export async function runDueChecks(db: Db, env: Env, now = new Date()): Promise<number> {
  const due = await db
    .select()
    .from(monitoringChecks)
    .where(
      and(
        eq(monitoringChecks.enabled, true),
        or(
          isNull(monitoringChecks.lastCheckedAt),
          lte(sql`${monitoringChecks.lastCheckedAt} + make_interval(secs => ${monitoringChecks.intervalSeconds})`, now),
        ),
      ),
    )
    .limit(MAX_CHECKS_PER_TICK);
  for (const check of due) await runCheck(db, env, check);
  return due.length;
}

// ponytail: temporizator în același proces, un singur nod; coadă externă dacă aplicația rulează pe mai multe instanțe.
export function startScheduler(db: Db, env: Env): () => void {
  let busy = false;
  let lastDaily = 0;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await runDueChecks(db, env);
      if (Date.now() - lastDaily >= DAILY_EVERY_MS) {
        lastDaily = Date.now();
        await runDailyChecks(db, env);
        await retryFailed(db, env);
      }
    } catch (err) {
      console.error("Job periodic eșuat:", err instanceof Error ? err.message : "eroare necunoscută");
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(() => void tick(), TICK_MS);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}