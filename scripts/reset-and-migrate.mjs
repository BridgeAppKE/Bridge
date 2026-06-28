import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
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
  const regions = [
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "af-south-1",
    "us-east-1",
    "us-west-1",
    "ap-southeast-1",
  ];

  const candidates = [
    { label: "direct (DATABASE_URL host)", host: hostname, port: 5432, user, password, database },
  ];

  for (const region of regions) {
    candidates.push({
      label: `pooler session ${region}`,
      host: `aws-0-${region}.pooler.supabase.com`,
      port: 5432,
      user: poolerUser,
      password,
      database,
    });
    candidates.push({
      label: `pooler transaction ${region}`,
      host: `aws-0-${region}.pooler.supabase.com`,
      port: 6543,
      user: poolerUser,
      password,
      database,
    });
  }

  return candidates;
}

async function connect(candidates) {
  const errors = [];
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
    } catch (error) {
      errors.push(`${candidate.label}: ${error.message}`);
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }

  throw new Error(`Could not connect to Postgres.\n${errors.slice(0, 6).join("\n")}`);
}

async function runSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  console.log(`Running ${path.basename(filePath)}...`);
  await client.query(sql);
}

async function verify(client) {
  const tables = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename"
  );
  const buckets = await client.query(
    "select id from storage.buckets where id = 'receipts'"
  );
  return {
    tables: tables.rows.map((row) => row.tablename),
    receiptsBucket: buckets.rows.length > 0,
  };
}

const env = loadEnv();
const candidates = buildCandidates(env);
const client = await connect(candidates);

try {
  await runSqlFile(client, path.join(root, "supabase/migrations/000_reset_public.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/001_initial_schema.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/002_circle_broadcasts.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/003_elitehost_extend.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/004_pms_foundation.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/005_circles_privacy.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/006_inventory_expenses_ai.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/007_operations.sql"));
  await runSqlFile(client, path.join(root, "supabase/migrations/008_compliance_pl.sql"));

  const result = await verify(client);
  console.log("\nMigration complete.");
  console.log("Public tables:", result.tables.join(", "));
  console.log("Receipts bucket:", result.receiptsBucket ? "yes" : "no");
} finally {
  await client.end();
}
