"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";

export async function broadcastInquiry(formData: FormData) {
  const checkIn = formData.get("check_in") as string;
  const checkOut = formData.get("check_out") as string;
  const guestCount = parseInt(formData.get("guest_count") as string, 10);
  const unitType = (formData.get("unit_type") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!checkIn || !checkOut || !unitType || isNaN(guestCount) || guestCount < 1) {
    return { error: "Dates, guest count, and unit type are required." };
  }

  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { data: circlePeers, error: circleError } = await supabase
    .from("circles_network")
    .select("id")
    .eq("host_id", user.id)
    .eq("status", "accepted");

  if (circleError) return { error: circleError.message };

  if (!circlePeers?.length) {
    return {
      error: "Add accepted Circle members before broadcasting an inquiry.",
    };
  }

  const { error } = await supabase.from("circle_broadcasts").insert({
    host_id: user.id,
    check_in: checkIn,
    check_out: checkOut,
    guest_count: guestCount,
    unit_type: unitType,
    notes,
  });

  if (error) {
    if (error.code === "42P01") {
      return {
        error:
          "Broadcast table not ready. Run supabase/migrations/002_circle_broadcasts.sql.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/home");
  revalidatePath("/circles");
  return {
    success: true,
    message: `Inquiry sent to ${circlePeers.length} Circle member(s).`,
  };
}
