import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveDevUserId } from "@/lib/auth/bypass";
import {
  DEMO_EXPENSE_VENDORS,
  DEMO_INVENTORY_ITEMS,
  DEMO_PEERS,
  DEMO_TASK_TITLES,
  DEV_HOST_UNITS,
} from "@/lib/demo/seed-catalog";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length];
}

async function inventoryTable(admin: ReturnType<typeof createServiceClient>) {
  const probe = await admin.from("inventory").select("id").limit(1);
  if (probe.error?.code === "42P01") return "inventory_rules" as const;
  return "inventory" as const;
}

export async function runDevSeed() {
  const admin = createServiceClient();
  const hostId = await resolveDevUserId();
  const batchId = randomUUID();

  const { data: existingState } = await admin.from("demo_seed_state").select("batch_id").maybeSingle();
  if (existingState?.batch_id) {
    await wipeDevSeed();
  }

  await admin.from("profiles").update({ full_name: "Dev Host", demo_seed_batch_id: batchId }).eq("id", hostId);

  const hostPropertyIds: string[] = [];

  for (let unitIndex = 0; unitIndex < DEV_HOST_UNITS.length; unitIndex++) {
    const unit = DEV_HOST_UNITS[unitIndex];
    const { data: property, error } = await admin
      .from("properties")
      .insert({
        owner_id: hostId,
        name: unit.name,
        location: unit.location,
        base_rate_kes: unit.baseRate,
        bedrooms: unit.bedrooms,
        demo_seed_batch_id: batchId,
        last_synced_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    hostPropertyIds.push(property.id);

    const table = await inventoryTable(admin);
    for (const item of DEMO_INVENTORY_ITEMS) {
      if (table === "inventory") {
        await admin.from("inventory").insert({
          property_id: property.id,
          name: item.name,
          category: "non_perishable",
          quantity: item.quantity,
          alert_threshold: item.alert_threshold,
          usage_per_guest: 1,
          demo_seed_batch_id: batchId,
        });
      } else {
        await admin.from("inventory_rules").insert({
          property_id: property.id,
          item_name: item.name,
          current_stock: item.quantity,
          alert_threshold: item.alert_threshold,
          usage_per_guest: 1,
          demo_seed_batch_id: batchId,
        });
      }
    }

    for (let day = -25; day <= 0; day += 5) {
      const date = addDays(new Date(), day);
      await admin.from("expenses").insert({
        property_id: property.id,
        amount_kes: 800 + (Math.abs(day) * 137) % 4200,
        category: pick(["Cleaning", "Supplies", "Utilities", "Maintenance"], Math.abs(day)),
        date,
        vendor_name: pick(DEMO_EXPENSE_VENDORS, Math.abs(day + property.id.length)),
        demo_seed_batch_id: batchId,
      });
    }

    for (let i = 0; i < 3; i++) {
      const start = addDays(new Date(), 3 + i * 9);
      const end = addDays(new Date(), 6 + i * 9);
      await admin.from("bookings").insert({
        property_id: property.id,
        start_date: start,
        end_date: end,
        guest_count: unit.bedrooms * 2,
        is_manual_block: i === 2,
        external_uid: `demo:${batchId}:${property.id}:${i}`,
        demo_seed_batch_id: batchId,
      });
    }

    await admin.from("operational_tasks").insert({
      property_id: property.id,
      title: pick(DEMO_TASK_TITLES, property.id.length + unitIndex),
      status: unitIndex % 2 === 0 ? "pending" : "in_progress",
      demo_seed_batch_id: batchId,
    });
  }

  const { data: circle, error: circleError } = await admin
    .from("circles")
    .insert({ name: "EliteHost Demo Circle", created_by: hostId, demo_seed_batch_id: batchId })
    .select("id")
    .single();

  if (circleError) throw new Error(circleError.message);

  await admin.from("circle_members").insert({
    circle_id: circle.id,
    profile_id: hostId,
    demo_seed_batch_id: batchId,
  });

  const peerProfileIds: string[] = [];

  for (const peer of DEMO_PEERS) {
    const email = `demo-${peer.hostName.toLowerCase().replace(/[^a-z]/g, "")}-${batchId.slice(0, 8)}@elitehost.demo`;
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: peer.hostName },
    });

    if (authError) throw new Error(authError.message);
    const profileId = authUser.user.id;
    peerProfileIds.push(profileId);

    await admin
      .from("profiles")
      .update({ full_name: peer.hostName, demo_seed_batch_id: batchId })
      .eq("id", profileId);

    await admin.from("circle_members").insert({
      circle_id: circle.id,
      profile_id: profileId,
      demo_seed_batch_id: batchId,
    });

    await admin.from("circle_invitations").insert({
      circle_id: circle.id,
      sender_id: hostId,
      receiver_id: profileId,
      status: "accepted",
      demo_seed_batch_id: batchId,
    });

    for (const unit of peer.units) {
      const { data: peerProperty } = await admin
        .from("properties")
        .insert({
          owner_id: profileId,
          name: unit.name,
          location: unit.location,
          base_rate_kes: unit.baseRate,
          bedrooms: unit.bedrooms,
          demo_seed_batch_id: batchId,
        })
        .select("id")
        .single();

      if (peerProperty) {
        await admin.from("bookings").insert({
          property_id: peerProperty.id,
          start_date: addDays(new Date(), 7),
          end_date: addDays(new Date(), 11),
          guest_count: unit.bedrooms,
          is_manual_block: false,
          external_uid: `demo:${batchId}:peer:${peerProperty.id}`,
          demo_seed_batch_id: batchId,
        });
      }
    }
  }

  await admin.from("demo_seed_state").upsert({
    id: 1,
    batch_id: batchId,
    host_profile_id: hostId,
    seeded_at: new Date().toISOString(),
  });

  return {
    batchId,
    hostPropertyCount: hostPropertyIds.length,
    peerCount: peerProfileIds.length,
  };
}

export async function wipeDevSeed() {
  const admin = createServiceClient();
  const { data: state } = await admin.from("demo_seed_state").select("batch_id").maybeSingle();
  const batchId = state?.batch_id;
  if (!batchId) return { ok: true, removed: 0 };

  const tables = [
    "invoices",
    "operational_tasks",
    "expenses",
    "bookings",
    "inventory",
    "inventory_rules",
    "circle_invitations",
    "circle_members",
    "ical_feeds",
    "properties",
    "circles",
  ] as const;

  let removed = 0;

  for (const table of tables) {
    const { count } = await admin
      .from(table)
      .delete({ count: "exact" })
      .eq("demo_seed_batch_id", batchId);
    removed += count ?? 0;
  }

  const { data: peerProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("demo_seed_batch_id", batchId);

  for (const profile of peerProfiles ?? []) {
    await admin.auth.admin.deleteUser(profile.id);
    removed++;
  }

  await admin.from("demo_seed_state").delete().eq("id", 1);

  return { ok: true, removed, batchId };
}
