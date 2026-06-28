"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InventoryRule } from "@/lib/types/database";

export async function createInventoryRule(formData: FormData) {
  const propertyId = formData.get("property_id") as string;
  const itemName = formData.get("item_name") as string;
  const usagePerGuest = parseFloat(formData.get("usage_per_guest") as string);
  const currentStock = parseFloat(formData.get("current_stock") as string);
  const alertThreshold = parseFloat(formData.get("alert_threshold") as string);

  if (!propertyId || !itemName || isNaN(usagePerGuest)) {
    return { error: "Unit, item name, and usage per guest are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_rules").insert({
    property_id: propertyId,
    item_name: itemName,
    usage_per_guest: usagePerGuest,
    current_stock: isNaN(currentStock) ? 0 : currentStock,
    alert_threshold: isNaN(alertThreshold) ? 0 : alertThreshold,
  });

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  return { success: true };
}

export type InventoryRuleWithProperty = InventoryRule & {
  properties: { name: string } | null;
};

export async function getInventoryRules(
  propertyId?: string
): Promise<InventoryRuleWithProperty[]> {
  const supabase = await createClient();

  let query = supabase
    .from("inventory_rules")
    .select("*, properties(name)")
    .order("item_name");

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryRuleWithProperty[];
}

export async function simulateCheckout(formData: FormData) {
  const propertyId = formData.get("property_id") as string;
  const guestCount = parseInt(formData.get("guest_count") as string, 10);

  if (!propertyId || isNaN(guestCount) || guestCount < 1) {
    return { error: "Select a property and enter at least 1 guest." };
  }

  const supabase = await createClient();
  const { data: rules, error } = await supabase
    .from("inventory_rules")
    .select("*")
    .eq("property_id", propertyId);

  if (error) return { error: error.message };
  if (!rules?.length) {
    return { error: "No inventory rules found for this property." };
  }

  const updates: { item: string; deducted: number; newStock: number; low: boolean }[] = [];

  for (const rule of rules) {
    const deduction = rule.usage_per_guest * guestCount;
    const newStock = Math.max(0, rule.current_stock - deduction);
    const low = newStock <= rule.alert_threshold;

    const { error: updateError } = await supabase
      .from("inventory_rules")
      .update({ current_stock: newStock })
      .eq("id", rule.id);

    if (updateError) return { error: updateError.message };

    updates.push({
      item: rule.item_name,
      deducted: deduction,
      newStock,
      low,
    });
  }

  revalidatePath("/inventory");
  return { success: true, updates, guestCount };
}

export async function deductInventoryForGuests(propertyId: string, guestCount: number) {
  const supabase = await createClient();
  const { data: rules, error } = await supabase
    .from("inventory_rules")
    .select("*")
    .eq("property_id", propertyId);

  if (error) return { error: error.message };
  if (!rules?.length) return { success: true };

  for (const rule of rules) {
    const deduction = rule.usage_per_guest * guestCount;
    const newStock = Math.max(0, rule.current_stock - deduction);
    await supabase
      .from("inventory_rules")
      .update({ current_stock: newStock })
      .eq("id", rule.id);
  }

  revalidatePath("/inventory");
  revalidatePath("/home");
  return { success: true };
}
