import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return null;
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
      .filter(Boolean)
  );
}

const env = loadEnv();
const base = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const secret = env.CRON_SECRET;

const headers = secret ? { Authorization: `Bearer ${secret}` } : {};

const res = await fetch(`${base}/api/cron/dev-simulate`, { headers });
const data = await res.json();
console.log(res.ok ? data : data.error ?? data);
