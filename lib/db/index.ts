import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

// Reuse across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __rignum_sql__: ReturnType<typeof postgres> | undefined;
}

export const sql =
  globalThis.__rignum_sql__ ??
  postgres(DATABASE_URL, {
    max: process.env.NODE_ENV === "development" ? 5 : 2,
    connect_timeout: 10,
    idle_timeout: 10,
    // keep IPv4-first behavior (works well with Supabase in many networks)
    // (NODE_OPTIONS is already set for seed; this is just a safe default)
  });

if (process.env.NODE_ENV === "development") {
  globalThis.__rignum_sql__ = sql;
}
