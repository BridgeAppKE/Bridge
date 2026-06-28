"use server";

import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import { getInventoryItems } from "@/lib/actions/inventory-v2";
import { getExpenses } from "@/lib/actions/expenses-v2";
import { getEtimsOptIn } from "@/lib/actions/compliance";
import { getOperationalTasks } from "@/lib/actions/operations";

export type UnitCardSummary = {
  id: string;
  name: string;
  baseRateKes: number;
  cleanerPhone: string | null;
  lowStockCount: number;
  spendMtd: number;
  pendingTasks: number;
};

export async function getUnitSummaries(): Promise<UnitCardSummary[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, base_rate_kes, cleaner_phone")
    .eq("owner_id", user.id)
    .order("name");

  if (error || !properties?.length) return [];

  const [items, expenses, tasks] = await Promise.all([
    getInventoryItems(),
    getExpenses(),
    getOperationalTasks(),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return properties.map((property) => {
    const propertyItems = items.filter((i) => i.property_id === property.id);
    const lowStockCount = propertyItems.filter(
      (i) => i.quantity <= i.alert_threshold
    ).length;

    const spendMtd = expenses
      .filter((e) => e.property_id === property.id)
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + Number(e.amount_kes), 0);

    const pendingTasks = tasks.filter(
      (t) => t.property_id === property.id && t.status !== "completed"
    ).length;

    return {
      id: property.id,
      name: property.name,
      baseRateKes: Number((property as { base_rate_kes?: number }).base_rate_kes ?? 8500),
      cleanerPhone: (property as { cleaner_phone?: string | null }).cleaner_phone ?? null,
      lowStockCount,
      spendMtd,
      pendingTasks,
    };
  });
}

export async function getUnitHubData(propertyId: string) {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createDataClient();
  const { data: property } = await supabase
    .from("properties")
    .select("id, name, owner_id, base_rate_kes")
    .eq("id", propertyId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!property) return null;

  const [items, expenses, tasks, etimsOptIn] = await Promise.all([
    getInventoryItems(propertyId),
    getExpenses(propertyId),
    getOperationalTasks(propertyId),
    getEtimsOptIn(),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const lowStockCount = items.filter((i) => i.quantity <= i.alert_threshold).length;
  const spendMtd = expenses
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + Number(e.amount_kes), 0);
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;

  return {
    property,
    lowStockCount,
    spendMtd,
    pendingTasks,
    etimsOptIn,
  };
}
