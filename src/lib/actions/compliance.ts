"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";

export async function getEtimsOptIn(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const supabase = await createDataClient();
  const { data } = await supabase
    .from("profiles")
    .select("etims_opt_in")
    .eq("id", user.id)
    .maybeSingle();

  return data?.etims_opt_in === true;
}

export async function setEtimsOptIn(optIn: boolean) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("profiles")
    .update({ etims_opt_in: optIn })
    .eq("id", user.id);

  if (error) {
    if (error.code === "42703") {
      return { error: "Run migration 004_pms_foundation.sql" };
    }
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/compliance");
  return { success: true };
}

export type InvoiceReviewRow = {
  id: string;
  booking_id: string;
  total_amount: number;
  status: string;
  property_name: string | null;
  created_at: string;
};

export async function getDraftReviewInvoices(): Promise<InvoiceReviewRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, booking_id, total_amount, status, created_at, properties(name)")
    .eq("status", "draft_review");

  if (error) {
    if (error.code === "42703" || error.code === "42P01") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const properties = row.properties;
    const property = (Array.isArray(properties) ? properties[0] : properties) as
      | { name: string }
      | null;
    return {
      id: row.id,
      booking_id: row.booking_id,
      total_amount: row.total_amount,
      status: row.status as string,
      property_name: property?.name ?? null,
      created_at: row.created_at,
    };
  });
}

export async function fileInvoiceToEtims(invoiceId: string) {
  const optIn = await getEtimsOptIn();
  if (!optIn) {
    return {
      error: "Enable eTIMS opt-in in Settings before filing to KRA.",
    };
  }

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "filed_etims" })
    .eq("id", invoiceId);

  if (error) return { error: error.message };

  revalidatePath("/compliance");
  return { success: true, message: "Invoice marked as filed (stub — wire KRA API later)." };
}

export type PlRow = {
  property_name: string;
  period_month: string;
  booking_revenue: number;
  expense_total: number;
  net: number;
};

export async function getPlSummary(): Promise<PlRow[]> {
  const supabase = await createDataClient();
  const { data, error } = await supabase.from("pl_summary").select("*");

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    property_name: row.property_name as string,
    period_month: row.period_month as string,
    booking_revenue: Number(row.booking_revenue ?? 0),
    expense_total: Number(row.expense_total ?? 0),
    net: Number(row.booking_revenue ?? 0) - Number(row.expense_total ?? 0),
  }));
}
