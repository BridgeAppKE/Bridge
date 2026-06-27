"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types/database";

export async function getUserProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function ensureDefaultProperty() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
