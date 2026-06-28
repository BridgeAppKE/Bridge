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
const hostId = state?.host_profile_id;

console.log("demo_seed_state:", state);

const { data: hostProps } = await admin
  .from("properties")
  .select("id, name")
  .eq("demo_seed_batch_id", batchId)
  .eq("owner_id", hostId);

for (const prop of hostProps ?? []) {
  const { data: bookings } = await admin
    .from("bookings")
    .select("start_date, end_date, is_manual_block")
    .eq("property_id", prop.id)
    .order("start_date");
  console.log(`\n${prop.name} (${bookings?.length ?? 0} bookings):`);
  for (const b of bookings ?? []) {
    console.log(`  ${b.start_date} → ${b.end_date}${b.is_manual_block ? " [block]" : ""}`);
  }
}

const { data: allInv } = await admin
  .from("inventory")
  .select("name, quantity, alert_threshold, properties(name)")
  .eq("demo_seed_batch_id", batchId);

const alerts = (allInv ?? []).filter((i) => i.quantity <= i.alert_threshold);
console.log(`\nLow stock alerts: ${alerts.length}`);
for (const a of alerts.slice(0, 8)) {
  const unit = a.properties?.name ?? "?";
  console.log(`  ${unit}: ${a.name} (${a.quantity}/${a.alert_threshold})`);
}

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date();
monthStart.setDate(1);
const ms = monthStart.toISOString().slice(0, 10);

const { data: revBookings } = await admin
  .from("bookings")
  .select("start_date, end_date, is_manual_block, properties(base_rate_kes)")
  .eq("demo_seed_batch_id", batchId)
  .eq("is_manual_block", false)
  .gte("end_date", ms)
  .lte("end_date", today)
  .in(
    "property_id",
    (hostProps ?? []).map((p) => p.id)
  );

let mtd = 0;
for (const b of revBookings ?? []) {
  const rate = Number(b.properties?.base_rate_kes ?? 8500);
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000
    )
  );
  mtd += nights * rate;
}
console.log(`\nHost MTD revenue (completed stays): KES ${mtd.toLocaleString()}`);
