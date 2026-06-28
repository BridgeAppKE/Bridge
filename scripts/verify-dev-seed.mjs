import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((line) => line && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: state } = await admin.from("demo_seed_state").select("*").maybeSingle();
const batchId = state?.batch_id;

const tables = ["properties", "bookings", "expenses", "circle_members", "operational_tasks"];

console.log("demo_seed_state:", state);
for (const table of tables) {
  const { count } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("demo_seed_batch_id", batchId);
  console.log(`${table}: ${count ?? 0} demo rows`);
}
