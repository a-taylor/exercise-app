// Database access layer.
//
// - When DATABASE_URL is set (production on Vercel with Vercel Postgres/Neon,
//   or a local Postgres instance), queries go through `pg`.
// - When DATABASE_URL is unset (local development with no Postgres available),
//   falls back to PGlite — real Postgres compiled to WASM, persisted to the
//   gitignored ./.pglite directory. Swap in a real database at any time by
//   setting DATABASE_URL; no code changes needed.

export interface QueryResult<T> {
  rows: T[];
}

type QueryFn = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => Promise<QueryResult<T>>;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS state (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_level int NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 12)
);

INSERT INTO state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS completions (
  date         date PRIMARY KEY,
  completed_at timestamptz NOT NULL DEFAULT now()
);
`;

let queryPromise: Promise<QueryFn> | null = null;

async function init(): Promise<QueryFn> {
  let query: QueryFn;

  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    query = async (text, params) => {
      const result = await pool.query(text, params as unknown[] | undefined);
      return { rows: result.rows };
    };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    const dataDir = "./.pglite/data";
    mkdirSync(dataDir, { recursive: true });
    const pglite = new PGlite(dataDir);
    query = async (text, params) => {
      const result = await pglite.query(text, params as unknown[] | undefined);
      return { rows: result.rows as never[] };
    };
  }

  // Idempotent schema setup, run once per process.
  for (const statement of SCHEMA_SQL.split(";")) {
    if (statement.trim()) await query(statement);
  }

  return query;
}

export async function dbQuery<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (!queryPromise) {
    queryPromise = init();
    // Don't cache a failed init so a transient error doesn't wedge the app.
    queryPromise.catch(() => {
      queryPromise = null;
    });
  }
  const query = await queryPromise;
  return query<T>(text, params);
}
