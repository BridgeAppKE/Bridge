"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import { syncUnitFromIcal } from "@/lib/sync/sync-service";

export type IcalFeed = {
  id: string;
  property_id: string;
  platform_name: string;
  url: string;
  last_synced_at: string | null;
};

export async function getIcalFeedsForProperty(propertyId: string): Promise<IcalFeed[]> {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("ical_feeds")
    .select("*")
    .eq("property_id", propertyId);

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getPrimaryIcalUrl(propertyId: string): Promise<string | null> {
  const feeds = await getIcalFeedsForProperty(propertyId);
  if (feeds.length) return feeds[0].url;
  const supabase = await createDataClient();
  const { data } = await supabase
    .from("properties")
    .select("ical_url")
    .eq("id", propertyId)
    .maybeSingle();
  return data?.ical_url ?? null;
}

export async function userHasAnyIcalFeed(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const supabase = await createDataClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", user.id);

  if (!properties?.length) return false;

  const ids = properties.map((p) => p.id);
  const { count } = await supabase
    .from("ical_feeds")
    .select("id", { count: "exact", head: true })
    .in("property_id", ids);

  return (count ?? 0) > 0;
}

export async function connectIcalFeed(
  propertyId: string,
  platformName: string,
  url: string
) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { data: property } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("ical_feeds").upsert(
    {
      property_id: propertyId,
      platform_name: platformName,
      url: url.trim(),
    },
    { onConflict: "property_id,platform_name" }
  );

  if (error) {
    if (error.code === "42P01") {
      return { error: "Run migration 004_pms_foundation.sql" };
    }
    return { error: error.message };
  }

  await supabase
    .from("properties")
    .update({ ical_url: url.trim() })
    .eq("id", propertyId);

  await supabase
    .from("profiles")
    .update({ ical_setup_deferred: false })
    .eq("id", user.id);

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/onboarding");

  return { success: true as const };
}

export async function connectIcalFeedAndSync(
  propertyId: string,
  platformName: string,
  url: string
) {
  const saved = await connectIcalFeed(propertyId, platformName, url);
  if (saved.error) return saved;

  const sync = await syncUnitFromIcal(propertyId, url.trim());
  if (sync.error) {
    return { success: true, syncWarning: sync.error };
  }

  return { success: true, syncedAt: sync.syncedAt, imported: sync.imported };
}

export async function deferIcalSetup() {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ical_setup_deferred: true })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/onboarding");
  return { success: true };
}

export async function dismissIcalNudge() {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  await supabase
    .from("profiles")
    .update({ ical_nudge_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/home");
  return { success: true };
}

export async function getExportFeedUrl(exportToken: string, origin: string) {
  return `${origin}/api/units/${exportToken}/ical`;
}
