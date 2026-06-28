"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import {
  parseMpesaText,
  parseReceiptStub,
  parseReceiptWithClaude,
} from "@/lib/parsers/expense-parsers";
import type { Expense } from "@/lib/types/database";

export const EXPENSE_CATEGORIES = [
  "Supplies",
  "Maintenance",
  "Utilities",
  "Cleaning",
  "Marketing",
  "Platform Fees",
  "Other",
] as const;

export async function getExpenseCategories() {
  return EXPENSE_CATEGORIES;
}

export async function parseMpesaStatement(text: string) {
  return parseMpesaText(text);
}

export async function parseReceiptFromUpload(fileName: string) {
  return parseReceiptStub(fileName);
}

export async function createExpense(formData: FormData) {
  const propertyId = formData.get("property_id") as string;
  const amountKes = parseFloat(formData.get("amount_kes") as string);
  const category = formData.get("category") as string;
  const date = formData.get("date") as string;
  const receiptUrl = (formData.get("receipt_url") as string) || null;
  const vendorName = (formData.get("vendor_name") as string) || null;
  const vendorKraPin = (formData.get("vendor_kra_pin") as string) || null;
  const etimsInvoiceNumber = (formData.get("etims_invoice_number") as string) || null;
  const mpesaReference = (formData.get("mpesa_reference_code") as string) || null;

  if (!propertyId || isNaN(amountKes) || !category || !date) {
    return { error: "All fields except receipt are required." };
  }

  const supabase = await createDataClient();
  const payload: Record<string, unknown> = {
    property_id: propertyId,
    amount_kes: amountKes,
    category,
    date,
    receipt_url: receiptUrl,
    vendor_name: vendorName,
    vendor_kra_pin: vendorKraPin,
    etims_invoice_number: etimsInvoiceNumber,
    mpesa_reference_code: mpesaReference,
    incurred_at: new Date(date).toISOString(),
  };

  const { error } = await supabase.from("expenses").insert(payload);

  if (error) {
    if (error.code === "23505" && mpesaReference) {
      return { error: "This M-Pesa reference was already logged." };
    }
    if (error.code === "42703") {
      delete payload.vendor_name;
      delete payload.vendor_kra_pin;
      delete payload.etims_invoice_number;
      delete payload.mpesa_reference_code;
      delete payload.incurred_at;
      const fallback = await supabase.from("expenses").insert({
        property_id: propertyId,
        amount_kes: amountKes,
        category,
        date,
        receipt_url: receiptUrl,
      });
      if (fallback.error) return { error: fallback.error.message };
    } else {
      return { error: error.message };
    }
  }

  revalidatePath("/expenses");
  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true };
}

export type SplitExpenseLine = {
  propertyId: string;
  amountKes: number;
};

export async function createSplitExpenses(payload: {
  totalAmount: number;
  lines: SplitExpenseLine[];
  category: string;
  date: string;
  vendorName?: string | null;
  receiptUrl?: string | null;
  mpesaReference?: string | null;
}) {
  const { totalAmount, lines, category, date, vendorName, receiptUrl, mpesaReference } =
    payload;

  if (!lines.length) return { error: "Allocate to at least one unit." };
  if (!category || !date) return { error: "Category and date are required." };

  const allocated = lines.reduce((sum, line) => sum + line.amountKes, 0);
  if (Math.abs(allocated - totalAmount) > 0.01) {
    return {
      error: `Split total (KES ${allocated.toLocaleString()}) must equal receipt total (KES ${totalAmount.toLocaleString()}).`,
    };
  }

  for (const line of lines) {
    if (line.amountKes <= 0) continue;
    const formData = new FormData();
    formData.set("property_id", line.propertyId);
    formData.set("amount_kes", String(line.amountKes));
    formData.set("category", category);
    formData.set("date", date);
    if (vendorName) formData.set("vendor_name", vendorName);
    if (receiptUrl) formData.set("receipt_url", receiptUrl);
    if (mpesaReference && lines.filter((l) => l.amountKes > 0).length === 1) {
      formData.set("mpesa_reference_code", mpesaReference);
    }

    const result = await createExpense(formData);
    if (result.error) return result;
  }

  return { success: true, count: lines.filter((l) => l.amountKes > 0).length };
}

export type ExpenseWithProperty = Expense & {
  properties: { name: string } | null;
  vendor_name?: string | null;
  mpesa_reference_code?: string | null;
};

export async function getExpenses(
  propertyId?: string
): Promise<ExpenseWithProperty[]> {
  const supabase = await createDataClient();

  let query = supabase
    .from("expenses")
    .select("*, properties(name)")
    .order("date", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ExpenseWithProperty[];
}

export async function uploadReceipt(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, file, { upsert: false });

  if (error) return { error: error.message };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ocrParsed = await parseReceiptWithClaude(
    buffer.toString("base64"),
    file.type || "image/jpeg"
  );
  const parsed = ocrParsed ?? parseReceiptStub(file.name);

  return { success: true, url: path, path, parsed, ocrAvailable: ocrParsed !== null };
}
