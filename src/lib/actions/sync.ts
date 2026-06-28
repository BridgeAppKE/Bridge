"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";

export async function mockSyncUnit(propertyId: string) {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("id, owner_id, ical_url")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) return { error: "Unit not found" };
  if (property.owner_id !== user.id) return { error: "Unauthorized" };

  const syncedAt = new Date().toISOString();

  const { error } = await supabase
    .from("properties")
    .update({ last_synced_at: syncedAt })
    .eq("id", propertyId);

  if (error) {
    if (error.code === "42703") {
      return {
        error: "Run migration 003_elitehost_extend.sql to enable sync timestamps.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/home");

  return {
    success: true,
    syncedAt,
    message: property.ical_url
      ? "Sync queued (mock). iCal parsing runs in browser on next phase."
      : "Timestamp updated. Add an iCal URL to this unit for calendar import.",
  };
}

export async function getCircleVisibleUnits() {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return [];

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, ical_url, last_synced_at, owner_id")
    .order("name");

  if (error) throw new Error(error.message);

  const { data: circles } = await supabase
    .from("circles_network")
    .select("host_id, trusted_peer_id, status")
    .eq("status", "accepted")
    .or(`host_id.eq.${user.id},trusted_peer_id.eq.${user.id}`);

  const peerOwnerIds = new Set<string>();
  circles?.forEach((c) => {
    if (c.host_id === user.id) peerOwnerIds.add(c.trusted_peer_id);
    else peerOwnerIds.add(c.host_id);
  });

  return (properties ?? []).filter(
    (p) => p.owner_id === user.id || peerOwnerIds.has(p.owner_id)
  );
}
