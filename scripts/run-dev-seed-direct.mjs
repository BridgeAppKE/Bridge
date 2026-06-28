import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();
process.env.BYPASS_AUTH = process.env.BYPASS_AUTH ?? "true";
process.env.DEV_SEED_ENABLED = process.env.DEV_SEED_ENABLED ?? "true";

const { runDevSeed } = await import("../src/lib/demo/seed-service.ts");
const { simulateDevHourly } = await import("../src/lib/demo/simulate-hourly.ts");

console.log("Seeding demo data...");
const seed = await runDevSeed();
console.log("Seed result:", seed);

console.log("Running hourly simulate tick...");
const sim = await simulateDevHourly();
console.log("Simulate result:", sim);
