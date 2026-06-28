import fs from "fs";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

const env = loadEnv();
const projectRef = "zlqipquxwqrknzggxsxu";
const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")
  ? env.NEXT_PUBLIC_SUPABASE_URL
  : `https://${projectRef}.supabase.co`;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = env.DATABASE_URL;

console.log("=== Supabase REST (publishable key) ===");
const pubClient = createClient(apiUrl, publishableKey);
const pubResult = await pubClient.from("profiles").select("id").limit(1);
console.log(
  pubResult.error
    ? pubResult.error.message.includes("Could not find the table")
      ? "OK — API connected (profiles table not created yet)"
      : `FAILED: ${pubResult.error.message}`
    : `OK — profiles query returned ${pubResult.data?.length ?? 0} row(s)`
);

console.log("\n=== Supabase REST (secret key) ===");
const adminClient = createClient(apiUrl, secretKey);
const adminResult = await adminClient.from("profiles").select("id").limit(1);
console.log(
  adminResult.error
    ? adminResult.error.message.includes("Could not find the table")
      ? "OK — API connected (profiles table not created yet)"
      : `FAILED: ${adminResult.error.message}`
    : `OK — profiles query returned ${adminResult.data?.length ?? 0} row(s)`
);

console.log("\n=== Direct Postgres ===");
if (!dbUrl) {
  console.log("No DATABASE_URL / postgres URI found");
} else {
  let pgConfig = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  };

  try {
    const parsed = new URL(dbUrl.replace(/^postgresql:/, "postgres:"));
    if (parsed.hostname === "db.zlqipquxwqrknzggxsxu.supabase.co") {
      pgConfig = {
        host: "2a05:d018:10e0:3302:20ed:a6d1:7168:499f",
        port: 5432,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, "") || "postgres",
        ssl: { rejectUnauthorized: false },
      };
    }
  } catch {
    // fall back to connection string
  }

  const pg = new Client(pgConfig);
  try {
    await pg.connect();
    const tables = await pg.query(
      "select tablename from pg_tables where schemaname = 'public' order by tablename"
    );
    console.log("OK — connected");
    console.log(
      "Public tables:",
      tables.rows.length
        ? tables.rows.map((row) => row.tablename).join(", ")
        : "(none — run supabase/migrations/001_initial_schema.sql)"
    );
    await pg.end();
  } catch (error) {
    console.log(`FAILED: ${error.message}`);
  }
}
