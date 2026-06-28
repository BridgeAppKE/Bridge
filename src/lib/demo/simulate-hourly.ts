import { createServiceClient } from "@/lib/supabase/admin";
import { DEMO_EXPENSE_VENDORS, DEMO_TASK_TITLES } from "@/lib/demo/seed-catalog";

function hourSeed() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
}

function seededRandom(seed: string, salt: number) {
  let hash = 0;
  const input = `${seed}:${salt}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function simulateDevHourly() {
  const admin = createServiceClient();
  const { data: state } = await admin.from("demo_seed_state").select("batch_id").maybeSingle();
  const batchId = state?.batch_id;
  if (!batchId) return { ok: true, actions: [] as string[] };

  const seed = hourSeed();
  const actions: string[] = [];

  const { data: properties } = await admin
    .from("properties")
    .select("id, owner_id")
    .eq("demo_seed_batch_id", batchId)
    .limit(20);

  if (!properties?.length) return { ok: true, actions: ["no demo properties"] };

  const property = properties[seededRandom(seed, 1) % properties.length];

  const roll = seededRandom(seed, 2) % 4;
  if (roll === 0) {
    await admin.from("expenses").insert({
      property_id: property.id,
      amount_kes: 350 + (seededRandom(seed, 3) % 900),
      category: "Supplies",
      date: new Date().toISOString().slice(0, 10),
      vendor_name: DEMO_EXPENSE_VENDORS[seededRandom(seed, 4) % DEMO_EXPENSE_VENDORS.length],
      demo_seed_batch_id: batchId,
    });
    actions.push("added expense");
  } else if (roll === 1) {
    await admin.from("bookings").insert({
      property_id: property.id,
      start_date: addDays(new Date(), 14),
      end_date: addDays(new Date(), 17),
      guest_count: 2,
      is_manual_block: seededRandom(seed, 5) % 3 === 0,
      external_uid: `demo:${batchId}:sim:${seed}`,
      demo_seed_batch_id: batchId,
    });
    actions.push("added booking/block");
  } else if (roll === 2) {
    const tableProbe = await admin.from("inventory").select("id, quantity").limit(1);
    const table = tableProbe.error?.code === "42P01" ? "inventory_rules" : "inventory";
    const { data: items } = await admin
      .from(table)
      .select(table === "inventory" ? "id, quantity" : "id, current_stock")
      .eq("property_id", property.id)
      .limit(5);

    const item = items?.[seededRandom(seed, 6) % (items?.length || 1)];
    if (item) {
      const qtyField = table === "inventory" ? "quantity" : "current_stock";
      const current = Number((item as Record<string, unknown>)[qtyField] ?? 0);
      await admin
        .from(table)
        .update({ [qtyField]: Math.max(0, current - 1) })
        .eq("id", item.id);
      actions.push("decremented stock");
    }
  } else {
    await admin.from("operational_tasks").insert({
      property_id: property.id,
      title: DEMO_TASK_TITLES[seededRandom(seed, 7) % DEMO_TASK_TITLES.length],
      status: "pending",
      demo_seed_batch_id: batchId,
    });
    actions.push("created ops task");
  }

  await admin
    .from("properties")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", property.id);

  return { ok: true, actions, batchId };
}
