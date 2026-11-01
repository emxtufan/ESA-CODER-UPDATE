/**
 * Extinderi de tip pentru Express: fiecare request are contextul aplicației
 * (db + env) și, după autentificare, identitatea și permisiunile sesiunii.
 */
import type { Db } from "./db/client";
import type { roles, sessions, users } from "./db/schema/auth";
import type { Env } from "./env";

declare global {
  namespace Express {
    interface Request {
      ctx: {
        db: Db;
        env: Env;
      };
      auth?: {
        session: typeof sessions.$inferSelect;
        user: typeof users.$inferSelect;
        role: typeof roles.$inferSelect;
        permissions: string[];
        mfaPending: boolean;
      };
    }
  }
}

export {};
