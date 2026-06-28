import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  return Object.fromEntries(
    fs
      .readFileSync(path.join(root, ".env.local"), "utf8")
      .split("\n")
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function parseDbUrl(dbUrl) {
  const parsed = new URL(dbUrl.replace(/^postgresql:/, "postgres:"));
  return {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    hostname: parsed.hostname,
  };
}

function buildCandidates(env) {
  const projectRef = "zlqipquxwqrknzggxsxu";
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL missing from .env.local");

  const { user, password, database, hostname } = parseDbUrl(dbUrl);
  const poolerUser = `postgres.${projectRef}`;
  const regions = ["eu-west-1", "eu-central-1", "us-east-1"];

  const candidates = [
    { label: "direct", host: hostname, port: 5432, user, password, database },
  ];

  for (const region of regions) {
    candidates.push({
      label: `pooler ${region}`,
      host: `aws-0-${region}.pooler.supabase.com`,
      port: 5432,
      user: poolerUser,
      password,
      database,
    });
  }

  return candidates;
}

async function connect(candidates) {
  for (const candidate of candidates) {
    const client = new Client({
      host: candidate.host,
      port: candidate.port,
      user: candidate.user,
      password: candidate.password,
      database: candidate.database,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      console.log(`Connected via: ${candidate.label}`);
      return client;
    } catch {
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }

  throw new Error("Could not connect to Postgres");
}

const env = loadEnv();
const client = await connect(buildCandidates(env));

try {
  const sql = fs.readFileSync(
    path.join(root, "supabase/migrations/003_elitehost_extend.sql"),
    "utf8"
  );
  await client.query(sql);
  const tables = await client.query(
    "select tablename from pg_tables where schemaname = 'public' and tablename in ('bookings', 'invoices') order by tablename"
  );
  console.log("003 applied. Tables:", tables.rows.map((r) => r.tablename).join(", "));
} finally {
  await client.end();
}
