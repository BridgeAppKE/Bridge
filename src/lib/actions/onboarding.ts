"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";

export type HostProfile = {
  id: string;
  full_name: string | null;
  legal_name: string | null;
  phone: string | null;
  kra_pin: string | null;
  short_code: string | null;
  onboarding_completed: boolean;
  ical_setup_deferred: boolean;
  ical_nudge_dismissed_at: string | null;
  circle_nudge_dismissed_at: string | null;
  created_at: string | null;
};

export async function getHostProfile(): Promise<HostProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, legal_name, phone, kra_pin, short_code, onboarding_completed, ical_setup_deferred, ical_nudge_dismissed_at, circle_nudge_dismissed_at, created_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code === "42703") {
      return {
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        legal_name: null,
        phone: null,
        kra_pin: null,
        short_code: null,
        onboarding_completed: true,
        ical_setup_deferred: false,
        ical_nudge_dismissed_at: null,
        circle_nudge_dismissed_at: null,
        created_at: null,
      };
    }
    throw new Error(error.message);
  }

  return data;
}

export async function isOnboardingComplete(): Promise<boolean> {
  const profile = await getHostProfile();
  if (!profile) return false;
  return profile.onboarding_completed === true;
}

export async function updateHostProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const legalName = (formData.get("legal_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const kraPin = (formData.get("kra_pin") as string)?.trim() || null;

  if (!legalName || !phone) {
    return { error: "Legal name and phone are required." };
  }

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      legal_name: legalName,
      full_name: legalName,
      phone,
      kra_pin: kraPin,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/onboarding");
  return { success: true };
}

export async function createUnitOnboarding(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const baseRate = parseFloat(formData.get("base_rate_kes") as string);

  if (!name || !location || isNaN(baseRate) || baseRate <= 0) {
    return { error: "Unit name, location, and base rate are required." };
  }

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      name,
      location,
      base_rate_kes: baseRate,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/onboarding");
  return { success: true, propertyId: data.id };
}

export async function lookupHostByCode(code: string) {
  if (!code?.trim()) return { error: "Enter a host code." };

  const supabase = await createDataClient();
  const { data, error } = await supabase.rpc("lookup_host_by_code", {
    code: code.trim(),
  });

  if (error) {
    if (error.code === "42883") {
      return { error: "Run migration 004_pms_foundation.sql" };
    }
    return { error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "No host found with that code." };

  return {
    success: true,
    profileId: row.profile_id as string,
    displayName: row.display_name as string,
    unitCount: Number(row.active_unit_count ?? 0),
  };
}

export async function inviteHostByCode(code: string) {
  const { inviteToCircleByCode } = await import("@/lib/actions/circles");
  return inviteToCircleByCode(code);
}

export async function dismissCircleNudge() {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  await supabase
    .from("profiles")
    .update({ circle_nudge_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/home");
  return { success: true };
}

export async function completeOnboarding() {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/home");
  revalidatePath("/onboarding");
  return { success: true };
}
