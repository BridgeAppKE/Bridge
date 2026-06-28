import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveDevUserId } from "@/lib/auth/bypass";
import {
  DEMO_PEERS,
  DEMO_TASK_TITLES,
  DEV_HOST_UNITS,
  EXPENSE_PROFILES,
  HOST_BOOKING_SCHEDULES,
  PEER_BOOKING_OFFSETS,
  UNIT_INVENTORY_PROFILES,
  type BookingSlot,
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

async function insertInventory(
  admin: ReturnType<typeof createServiceClient>,
  table: "inventory" | "inventory_rules",
  propertyId: string,
  batchId: string,
  unitName: string
) {
  const items = UNIT_INVENTORY_PROFILES[unitName] ?? UNIT_INVENTORY_PROFILES["Kilimani Loft"];

  for (const item of items) {
    if (table === "inventory") {
      await admin.from("inventory").insert({
        property_id: propertyId,
        name: item.name,
        category: "non_perishable",
        quantity: item.quantity,
        alert_threshold: item.alert_threshold,
        usage_per_guest: 1,
        demo_seed_batch_id: batchId,
      });
    } else {
      await admin.from("inventory_rules").insert({
        property_id: propertyId,
        item_name: item.name,
        current_stock: item.quantity,
        alert_threshold: item.alert_threshold,
        usage_per_guest: 1,
        demo_seed_batch_id: batchId,
      });
    }
  }
}

async function insertBookingSchedule(
  admin: ReturnType<typeof createServiceClient>,
  propertyId: string,
  batchId: string,
  slots: BookingSlot[],
  guestCount: number,
  uidPrefix: string
) {
  const today = new Date();
  for (let i = 0; i < slots.length; i++) {
    const [startOff, endOff, isBlock] = slots[i];
    await admin.from("bookings").insert({
      property_id: propertyId,
      start_date: addDays(today, startOff),
      end_date: addDays(today, endOff),
      guest_count: isBlock ? null : guestCount,
      is_manual_block: Boolean(isBlock),
      external_uid: `demo:${batchId}:${uidPrefix}:${i}`,
      demo_seed_batch_id: batchId,
    });
  }
}

async function ensureDevHostId(admin: ReturnType<typeof createServiceClient>): Promise<string> {
  if (process.env.DEV_USER_ID) return process.env.DEV_USER_ID;

  try {
    return await resolveDevUserId();
  } catch {
    const email = `dev-host@elitehost.local`;
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const first = existing?.users?.[0];
    if (first?.id) return first.id;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: "Dev Host" },
    });
    if (error) throw new Error(error.message);
    return data.user.id;
  }
}

export async function runDevSeed() {
  const admin = createServiceClient();
  const hostId = await ensureDevHostId(admin);
  const batchId = randomUUID();

  await admin.from("profiles").upsert(
    { id: hostId, full_name: "Dev Host" },
    { onConflict: "id" }
  );

  const { data: existingState } = await admin.from("demo_seed_state").select("batch_id").maybeSingle();
  if (existingState?.batch_id) {
    await wipeDevSeed();
  }

  // Clear stale non-demo host units so calendar isn't duplicated
  const { data: staleUnits } = await admin
    .from("properties")
    .select("id")
    .eq("owner_id", hostId)
    .is("demo_seed_batch_id", null);

  for (const unit of staleUnits ?? []) {
    await admin.from("bookings").delete().eq("property_id", unit.id);
    await admin.from("expenses").delete().eq("property_id", unit.id);
    await admin.from("inventory").delete().eq("property_id", unit.id);
    await admin.from("inventory_rules").delete().eq("property_id", unit.id);
    await admin.from("operational_tasks").delete().eq("property_id", unit.id);
    await admin.from("properties").delete().eq("id", unit.id);
  }

  await admin
    .from("profiles")
    .update({ full_name: "Dev Host", demo_seed_batch_id: batchId })
    .eq("id", hostId);

  const table = await inventoryTable(admin);
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
        last_synced_at: new Date(Date.now() - unitIndex * 3600_000).toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    hostPropertyIds.push(property.id);

    await insertInventory(admin, table, property.id, batchId, unit.name);

    const expenseSlice = EXPENSE_PROFILES.filter((_, i) => i % DEV_HOST_UNITS.length === unitIndex);
    for (const exp of expenseSlice.length ? expenseSlice : EXPENSE_PROFILES.slice(0, 2)) {
      await admin.from("expenses").insert({
        property_id: property.id,
        amount_kes: exp.amount + unitIndex * 420,
        category: exp.category,
        date: addDays(new Date(), exp.dayOffset - unitIndex),
        vendor_name: exp.vendor,
        demo_seed_batch_id: batchId,
      });
    }

    const schedule = HOST_BOOKING_SCHEDULES[unit.name] ?? HOST_BOOKING_SCHEDULES["Kilimani Loft"];
    await insertBookingSchedule(
      admin,
      property.id,
      batchId,
      schedule,
      unit.bedrooms * 2,
      property.id
    );

    await admin.from("operational_tasks").insert({
      property_id: property.id,
      title: pick(DEMO_TASK_TITLES, unitIndex + 2),
      status: unitIndex === 0 ? "pending" : unitIndex === 1 ? "in_progress" : "completed",
      due_at: addDays(new Date(), unitIndex + 1) + "T10:00:00Z",
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

  for (let peerIndex = 0; peerIndex < DEMO_PEERS.length; peerIndex++) {
    const peer = DEMO_PEERS[peerIndex];
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
      .update({
        full_name: peer.hostName,
        demo_seed_batch_id: batchId,
        short_code: `DEMO${1000 + peerIndex}`,
      })
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

      if (!peerProperty) continue;

      const peerSchedule =
        PEER_BOOKING_OFFSETS[unit.name] ?? [[10 + peerIndex * 3, 14 + peerIndex * 3]];

      await insertBookingSchedule(
        admin,
        peerProperty.id,
        batchId,
        peerSchedule,
        unit.bedrooms,
        `peer-${peerProperty.id}`
      );

      // Peer past stays (for their own revenue if viewed)
      await insertBookingSchedule(
        admin,
        peerProperty.id,
        batchId,
        [[-30 - peerIndex * 4, -26 - peerIndex * 4]],
        unit.bedrooms,
        `peer-past-${peerProperty.id}`
      );
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
  const { data: state } = await admin
    .from("demo_seed_state")
    .select("batch_id, host_profile_id")
    .maybeSingle();
  const batchId = state?.batch_id;
  if (!batchId) return { ok: true, removed: 0 };

  const hostProfileId = state?.host_profile_id;

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
    if (profile.id === hostProfileId) continue;
    await admin.auth.admin.deleteUser(profile.id);
    removed++;
  }

  if (hostProfileId) {
    await admin
      .from("profiles")
      .update({ demo_seed_batch_id: null })
      .eq("id", hostProfileId);
  }

  await admin.from("demo_seed_state").delete().eq("id", 1);

  return { ok: true, removed, batchId };
}
