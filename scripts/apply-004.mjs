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

const env = loadEnv();
const parsed = new URL(env.DATABASE_URL.replace(/^postgresql:/, "postgres:"));
const client = new Client({
  host: "aws-0-eu-west-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.zlqipquxwqrknzggxsxu",
  password: decodeURIComponent(parsed.password),
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const sql = fs.readFileSync(
  path.join(root, "supabase/migrations/004_pms_foundation.sql"),
  "utf8"
);
await client.query(sql);
console.log("004_pms_foundation applied");
await client.end();
