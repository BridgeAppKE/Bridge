"use server";

import { revalidatePath } from "next/cache";
import { createDataClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types/database";

export type InventoryWithProperty = InventoryItem & {
  properties: { name: string } | null;
};

const TABLE = "inventory";

async function inventoryTable(supabase: Awaited<ReturnType<typeof createDataClient>>) {
  const probe = await supabase.from(TABLE).select("id").limit(1);
  if (probe.error?.code === "42P01") return "inventory_rules";
  return TABLE;
}

export async function getInventoryItems(
  propertyId?: string,
  category?: InventoryItem["category"]
): Promise<InventoryWithProperty[]> {
  const supabase = await createDataClient();
  const table = await inventoryTable(supabase);

  let query = supabase
    .from(table)
    .select(table === TABLE ? "*, properties(name)" : "*, properties(name)")
    .order(table === TABLE ? "name" : "item_name");

  if (propertyId) query = query.eq("property_id", propertyId);
  if (category && table === TABLE) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  if (table === "inventory_rules") {
    return (data ?? []).map((row) => ({
      id: row.id,
      property_id: row.property_id,
      name: row.item_name,
      category: "perishable" as const,
      quantity: row.current_stock,
      alert_threshold: row.alert_threshold,
      usage_per_guest: row.usage_per_guest,
      usable_status: null,
      created_at: row.created_at,
      properties: row.properties,
    }));
  }

  return (data ?? []) as InventoryWithProperty[];
}

export async function createInventoryItem(formData: FormData) {
  const propertyId = formData.get("property_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as InventoryItem["category"]) || "perishable";
  const quantity = parseFloat(formData.get("quantity") as string);
  const usagePerGuest = parseFloat(formData.get("usage_per_guest") as string);
  const alertThreshold = parseFloat(formData.get("alert_threshold") as string);
  const usableStatus = (formData.get("usable_status") as string) || null;

  if (!propertyId || !name) {
    return { error: "Unit and item name are required." };
  }

  const supabase = await createDataClient();
  const table = await inventoryTable(supabase);

  if (table === TABLE) {
    const { error } = await supabase.from(TABLE).insert({
      property_id: propertyId,
      name,
      category,
      quantity: isNaN(quantity) ? 0 : quantity,
      usage_per_guest: isNaN(usagePerGuest) ? 1 : usagePerGuest,
      alert_threshold: isNaN(alertThreshold) ? 0 : alertThreshold,
      usable_status:
        category === "usable" && usableStatus
          ? (usableStatus as InventoryItem["usable_status"])
          : null,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("inventory_rules").insert({
      property_id: propertyId,
      item_name: name,
      current_stock: isNaN(quantity) ? 0 : quantity,
      usage_per_guest: isNaN(usagePerGuest) ? 1 : usagePerGuest,
      alert_threshold: isNaN(alertThreshold) ? 0 : alertThreshold,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/inventory");
  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true };
}

export async function bulkCreateInventoryItems(
  propertyId: string,
  itemNames: string[]
) {
  if (!propertyId || !itemNames.length) {
    return { error: "Select at least one item." };
  }

  const supabase = await createDataClient();
  const table = await inventoryTable(supabase);
  const { AIRBNB_CHECKLIST_ITEMS } = await import("@/lib/inventory/checklist-presets");

  const presetMap = new Map<string, (typeof AIRBNB_CHECKLIST_ITEMS)[number]>(
    AIRBNB_CHECKLIST_ITEMS.map((i) => [i.name, i])
  );

  for (const name of itemNames) {
    const preset = presetMap.get(name);
    if (table === TABLE) {
      const { error } = await supabase.from(TABLE).insert({
        property_id: propertyId,
        name,
        category: "non_perishable",
        quantity: preset?.quantity ?? 1,
        alert_threshold: preset?.alert_threshold ?? 1,
        usage_per_guest: 1,
      });
      if (error && error.code !== "23505") return { error: error.message };
    } else {
      const { error } = await supabase.from("inventory_rules").insert({
        property_id: propertyId,
        item_name: name,
        current_stock: preset?.quantity ?? 1,
        alert_threshold: preset?.alert_threshold ?? 1,
        usage_per_guest: 1,
      });
      if (error && error.code !== "23505") return { error: error.message };
    }
  }

  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true, count: itemNames.length };
}

export async function updateInventoryQuantity(itemId: string, delta: number) {
  const supabase = await createDataClient();
  const table = await inventoryTable(supabase);

  const qtyField = table === TABLE ? "quantity" : "current_stock";

  const { data: item, error: fetchError } = await supabase
    .from(table)
    .select(`id, ${qtyField}`)
    .eq("id", itemId)
    .single();

  if (fetchError || !item) return { error: "Item not found" };

  const current = Number((item as Record<string, unknown>)[qtyField] ?? 0);
  const next = Math.max(0, current + delta);

  const { error } = await supabase
    .from(table)
    .update({ [qtyField]: next })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true, quantity: next };
}

export async function updateUsableStatus(itemId: string, status: InventoryItem["usable_status"]) {
  const supabase = await createDataClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ usable_status: status })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { success: true };
}

export async function getLowStockAlerts() {
  const items = await getInventoryItems();
  return items
    .filter((item) => item.quantity <= item.alert_threshold)
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      propertyName: item.properties?.name ?? "Unit",
      category: item.category,
    }));
}
