"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import type { Property } from "@/lib/types/database";

export async function getUserProperties(): Promise<Property[]> {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPropertyForOwner(propertyId: string) {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createDataClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return data;
}

export async function ensureDefaultProperty() {
  const onboardingDone = await import("@/lib/actions/onboarding").then((m) =>
    m.isOnboardingComplete()
  );
  if (!onboardingDone) return null;

  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return null;

  const { data: existing } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0];
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({ owner_id: user.id, name: "My Nairobi Apartment" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/home");
  return data;
}

export async function createUnit(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const icalUrl = (formData.get("ical_url") as string)?.trim() || null;

  if (!name) return { error: "Unit name is required." };

  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("properties").insert({
    owner_id: user.id,
    name,
    ical_url: icalUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/unit");
  return { success: true };
}

export async function updatePropertyName(propertyId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Unit name is required." };
  if (trimmed.length > 48) return { error: "Keep the name under 48 characters." };

  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("properties")
    .update({ name: trimmed })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/unit");
  revalidatePath(`/unit/${propertyId}`);
  return { success: true };
}
