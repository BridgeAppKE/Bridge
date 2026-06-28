"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import { isPastDate } from "@/lib/inventory/consumption";
import { bookingNights } from "@/lib/inventory/consumption";

export type BookingInput = {
  external_uid?: string;
  start_date: string;
  end_date: string;
  is_manual_block: boolean;
  guest_count?: number;
};

export async function upsertBookingsFromSync(
  propertyId: string,
  events: BookingInput[]
) {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { data: property } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== user.id) {
    return { error: "Unauthorized" };
  }

  let count = 0;

  for (const event of events) {
    if (event.external_uid) {
      const { error } = await supabase.from("bookings").upsert(
        {
          property_id: propertyId,
          start_date: event.start_date,
          end_date: event.end_date,
          is_manual_block: event.is_manual_block,
          guest_count: event.guest_count ?? null,
          external_uid: event.external_uid,
        },
        { onConflict: "property_id,external_uid" }
      );
      if (error) {
        if (error.code === "42P01") {
          return { error: "Run migration 003_elitehost_extend.sql for bookings." };
        }
        return { error: error.message };
      }
    } else {
      const { error } = await supabase.from("bookings").insert({
        property_id: propertyId,
        start_date: event.start_date,
        end_date: event.end_date,
        is_manual_block: event.is_manual_block,
        guest_count: event.guest_count ?? null,
      });
      if (error) return { error: error.message };
    }
    count += 1;
  }

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/circles");
  return { success: true, count };
}

export async function blockDates(formData: FormData) {
  const propertyId = formData.get("property_id") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;

  if (!propertyId || !startDate || !endDate) {
    return { error: "Unit and dates are required." };
  }

  if (isPastDate(startDate) || isPastDate(endDate)) {
    return { error: "Cannot block dates in the past." };
  }

  if (endDate <= startDate) {
    return { error: "End date must be after start date." };
  }

  return upsertBookingsFromSync(propertyId, [
    {
      start_date: startDate,
      end_date: endDate,
      is_manual_block: true,
      external_uid: `manual-${propertyId}-${startDate}-${endDate}`,
    },
  ]);
}

export async function createManualBooking(formData: FormData) {
  const propertyId = formData.get("property_id") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const guestName = (formData.get("guest_name") as string)?.trim();
  const guestPhone = (formData.get("guest_phone") as string)?.trim() || null;
  const bedroomType = (formData.get("bedroom_type") as string) || null;
  const amountRaw = formData.get("amount_kes") as string;
  const paymentMethod = (formData.get("payment_method") as string) || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!propertyId || !startDate || !endDate) {
    return { error: "Unit and dates are required." };
  }
  if (!guestName) {
    return { error: "Guest name is required." };
  }
  if (endDate <= startDate) {
    return { error: "Check-out must be after check-in." };
  }

  const supabase = await createDataClient();
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const { data: property } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const amountKes = amountRaw ? Number(amountRaw) : null;

  const { error } = await supabase.from("bookings").insert({
    property_id: propertyId,
    start_date: startDate,
    end_date: endDate,
    is_manual_block: false,
    guest_name: guestName,
    guest_phone: guestPhone,
    bedroom_type: bedroomType,
    amount_kes: amountKes !== null && !isNaN(amountKes) ? amountKes : null,
    payment_method: paymentMethod,
    notes,
  });

  if (error) {
    if (error.code === "42703") {
      return { error: "Run migration 012_manual_booking_fields.sql" };
    }
    return { error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/circles");
  return { success: true };
}

export async function clearManualBlock(bookingId: string) {
  const supabase = await createDataClient();
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, is_manual_block, properties(owner_id)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) return { error: "Booking not found" };

  const props = Array.isArray(booking.properties)
    ? booking.properties[0]
    : booking.properties;
  const ownerId = (props as { owner_id: string } | null | undefined)?.owner_id;
  if (ownerId !== user.id) return { error: "Unauthorized" };

  if (!booking.is_manual_block) {
    return { error: "Only manual blocks can be cleared here. Guest bookings sync from your channel." };
  }

  const { error: deleteError } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/calendar");
  revalidatePath("/home");
  revalidatePath("/circles");
  return { success: true };
}

export async function getBookingsForProperty(propertyId: string) {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("property_id", propertyId)
    .order("start_date");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllVisibleBookings() {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, properties(name, owner_id)")
    .order("start_date");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function finalizeBooking(bookingId: string, guestCount: number) {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, properties(id, owner_id)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) return { error: "Booking not found" };

  const property = booking.properties as { id: string; owner_id: string } | null;
  if (!property || property.owner_id !== user.id) {
    return { error: "Unauthorized" };
  }

  await supabase
    .from("bookings")
    .update({ guest_count: guestCount })
    .eq("id", bookingId);

  const nights = bookingNights(booking.start_date, booking.end_date);
  const { deductInventoryForStay } = await import("@/lib/actions/inventory-v2");
  await deductInventoryForStay(property.id, guestCount, nights);

  revalidatePath("/inventory");
  revalidatePath("/home");
  revalidatePath("/unit");
  return { success: true, nights, guestCount };
}

export async function updateUnitLastSynced(propertyId: string, syncedAt: string) {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("properties")
    .update({ last_synced_at: syncedAt })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}

export async function createInvoiceRecord(
  bookingId: string,
  totalAmount: number,
  pdfUrl?: string,
  propertyId?: string
) {
  const { getEtimsOptIn } = await import("@/lib/actions/compliance");
  const supabase = await createDataClient();
  const optIn = await getEtimsOptIn();

  let resolvedPropertyId = propertyId;
  if (!resolvedPropertyId) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("property_id")
      .eq("id", bookingId)
      .maybeSingle();
    resolvedPropertyId = booking?.property_id;
  }

  const { error } = await supabase.from("invoices").insert({
    booking_id: bookingId,
    total_amount: totalAmount,
    pdf_url: pdfUrl ?? null,
    property_id: resolvedPropertyId ?? null,
    gross_amount: totalAmount,
    net_amount: totalAmount,
    vat_amount: 0,
    status: optIn ? "draft_review" : "private_only",
  });

  if (error) return { error: error.message };
  revalidatePath("/unit");
  return { success: true, draftReview: optIn };
}

export async function getBookingsWithRevenue() {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, start_date, end_date, guest_count, is_manual_block, properties(name, base_rate_kes)")
    .eq("is_manual_block", false)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
