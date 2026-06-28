"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import {
  buildEtimsQrPayload,
  submitInvoiceToDigitax,
} from "@/lib/etims/digitax-client";
import { generateInvoicePdfBuffer } from "@/lib/etims/generate-etims-invoice-pdf";

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

  revalidatePath("/unit");
  return { success: true };
}

export type InvoiceReviewRow = {
  id: string;
  booking_id: string;
  total_amount: number;
  status: string;
  property_name: string | null;
  created_at: string;
  pdf_url: string | null;
};

export async function getDraftReviewInvoices(
  propertyId?: string
): Promise<InvoiceReviewRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();
  let query = supabase
    .from("invoices")
    .select(
      "id, booking_id, total_amount, status, created_at, pdf_url, property_id, properties(name)"
    )
    .eq("status", "draft_review");

  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;

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
      pdf_url: row.pdf_url as string | null,
    };
  });
}

export async function fileInvoiceToEtims(invoiceId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const optIn = await getEtimsOptIn();
  if (!optIn) {
    return { error: "Enable eTIMS opt-in before filing to KRA." };
  }

  const supabase = await createDataClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("legal_name, full_name, etims_api_key_encrypted, kra_pin")
    .eq("id", user.id)
    .maybeSingle();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*, bookings(start_date, end_date, guest_count, property_id, properties(name, base_rate_kes))")
    .eq("id", invoiceId)
    .single();

  if (fetchError || !invoice) return { error: "Invoice not found" };

  const bookings = invoice.bookings;
  const booking = (Array.isArray(bookings) ? bookings[0] : bookings) as {
    start_date: string;
    end_date: string;
    guest_count: number | null;
    properties: { name: string; base_rate_kes: number | null } | null;
  } | null;

  if (!booking) return { error: "Booking not found for invoice" };

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const rate = Number(booking.properties?.base_rate_kes ?? 8500);
  const guestCount = Math.max(booking.guest_count ?? 1, 1);
  const total = nights * rate * guestCount;

  try {
    const digitaxResponse = await submitInvoiceToDigitax(
      {
        invoiceNumber: invoiceId.slice(0, 8).toUpperCase(),
        customerName: "Guest",
        lineItems: [
          {
            description: `Accommodation · ${booking.properties?.name ?? "Unit"}`,
            quantity: nights,
            unitPrice: rate * guestCount,
          },
        ],
      },
      profile?.etims_api_key_encrypted
    );

    const qrPayload = buildEtimsQrPayload(digitaxResponse);
    const hostName = profile?.legal_name ?? profile?.full_name ?? "Host";

    const pdfBuffer = await generateInvoicePdfBuffer({
      bookingId: invoice.booking_id,
      unitName: booking.properties?.name ?? "Unit",
      guestCount,
      startDate: booking.start_date,
      endDate: booking.end_date,
      nightlyRate: rate,
      hostName,
      etims: { ...digitaxResponse, qrPayload },
    });

    const pdfPath = `${user.id}/invoices/${invoiceId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    const pdfUrl = uploadError ? null : pdfPath;

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "filed_etims",
        pdf_url: pdfUrl,
        etims_receipt_number: digitaxResponse.cuInvoiceNo,
        etims_internal_data: digitaxResponse.internalData,
        etims_receipt_signature: digitaxResponse.receiptSignature,
        etims_qr_payload: qrPayload,
        etims_cu_serial: digitaxResponse.cuSerial,
        digitax_invoice_id: digitaxResponse.digitaxInvoiceId,
        filed_at: new Date().toISOString(),
        gross_amount: total,
        net_amount: total,
        vat_amount: 0,
      })
      .eq("id", invoiceId);

    if (updateError) return { error: updateError.message };

    revalidatePath("/unit");
    return {
      success: true,
      message: "Invoice filed to eTIMS. PDF ready to share with guest.",
      pdfUrl,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "DigiTax filing failed",
    };
  }
}

export async function getInvoiceShareUrl(invoiceId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("pdf_url, status")
    .eq("id", invoiceId)
    .single();

  if (!invoice?.pdf_url) return { error: "No PDF available yet. File to eTIMS first." };

  const { data: signed } = await supabase.storage
    .from("receipts")
    .createSignedUrl(invoice.pdf_url, 60 * 60 * 24 * 7);

  if (!signed?.signedUrl) return { error: "Could not generate share link" };
  return { success: true, url: signed.signedUrl };
}

export type PlRow = {
  property_name: string;
  period_month: string;
  booking_revenue: number;
  expense_total: number;
  net: number;
};

export async function getPlSummary(propertyId?: string): Promise<PlRow[]> {
  const supabase = await createDataClient();
  let query = supabase.from("pl_summary").select("*");

  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;

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
