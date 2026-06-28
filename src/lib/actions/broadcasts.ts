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

  const circleId = (formData.get("circle_id") as string)?.trim() || null;

  let targetCircleId = circleId;
  if (!targetCircleId) {
    const { data: membership } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();

    targetCircleId = membership?.circle_id ?? null;
  }

  if (!targetCircleId) {
    return { error: "Create a Circle and add members before broadcasting." };
  }

  const { count: memberCount, error: memberError } = await supabase
    .from("circle_members")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", targetCircleId);

  if (memberError) return { error: memberError.message };
  if (!memberCount || memberCount < 2) {
    return {
      error: "Add at least one accepted Circle member before broadcasting.",
    };
  }

  const { error } = await supabase.from("circle_broadcasts").insert({
    host_id: user.id,
    circle_id: targetCircleId,
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
    message: `Inquiry sent to your Circle (${Math.max(0, (memberCount ?? 1) - 1)} peer(s)).`,
  };
}
