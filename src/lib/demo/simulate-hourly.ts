import { createServiceClient } from "@/lib/supabase/admin";
import { DEMO_EXPENSE_VENDORS } from "@/lib/demo/seed-catalog";

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

/** Subtle hourly nudge — small expense or stock tweak only (no duplicate booking spam). */
export async function simulateDevHourly() {
  const admin = createServiceClient();
  const { data: stateRow } = await admin
    .from("demo_seed_state")
    .select("batch_id, host_profile_id")
    .maybeSingle();
  const batchId = stateRow?.batch_id;
  if (!batchId || !stateRow?.host_profile_id) {
    return { ok: true, actions: [] as string[] };
  }

  const seed = hourSeed();
  const actions: string[] = [];

  const { data: hostProperties } = await admin
    .from("properties")
    .select("id")
    .eq("demo_seed_batch_id", batchId)
    .eq("owner_id", stateRow.host_profile_id)
    .limit(4);

  if (!hostProperties?.length) return { ok: true, actions: ["no demo properties"] };

  const property = hostProperties[seededRandom(seed, 1) % hostProperties.length];
  const roll = seededRandom(seed, 2) % 3;

  if (roll === 0) {
    const amount = 450 + (seededRandom(seed, 3) % 1200);
    await admin.from("expenses").insert({
      property_id: property.id,
      amount_kes: amount,
      category: seededRandom(seed, 4) % 2 === 0 ? "Supplies" : "Cleaning",
      date: new Date().toISOString().slice(0, 10),
      vendor_name: DEMO_EXPENSE_VENDORS[seededRandom(seed, 5) % DEMO_EXPENSE_VENDORS.length],
      demo_seed_batch_id: batchId,
    });
    actions.push(`logged KES ${amount} expense`);
  } else if (roll === 1) {
    const tableProbe = await admin.from("inventory").select("id").limit(1);
    const table = tableProbe.error?.code === "42P01" ? "inventory_rules" : "inventory";
    const qtyField = table === "inventory" ? "quantity" : "current_stock";

    const { data: items } = await admin
      .from(table)
      .select(`id, ${qtyField}, alert_threshold`)
      .eq("property_id", property.id);

    const lowItems = (items ?? []).filter(
      (item) =>
        Number((item as Record<string, unknown>)[qtyField] ?? 0) <=
        Number((item as Record<string, unknown>).alert_threshold ?? 0)
    );

    const target = lowItems[seededRandom(seed, 6) % (lowItems.length || 1)] ?? items?.[0];
    if (target) {
      const current = Number((target as Record<string, unknown>)[qtyField] ?? 0);
      await admin
        .from(table)
        .update({ [qtyField]: current + 2 })
        .eq("id", target.id);
      actions.push("restocked low item (+2)");
    }
  } else {
    await admin
      .from("properties")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", property.id);
    actions.push("refreshed last synced");
  }

  return { ok: true, actions, batchId };
}
