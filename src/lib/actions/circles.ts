"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import { getUserIdByEmail } from "@/lib/supabase/admin";
import type { AvailabilityProperty, CircleMember } from "@/lib/types/database";

export async function inviteToCircle(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  let peerId: string | null;
  try {
    peerId = await getUserIdByEmail(email);
  } catch (lookupError) {
    return {
      error:
        lookupError instanceof Error
          ? lookupError.message
          : "Failed to look up user",
    };
  }

  if (!peerId) {
    return {
      error:
        "No account found with that email. Ask them to sign up first, then invite again.",
    };
  }

  if (peerId === user.id) {
    return { error: "You cannot invite yourself to your Circle." };
  }

  const { error } = await supabase.from("circles_network").insert({
    host_id: user.id,
    trusted_peer_id: peerId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An invite already exists for this host." };
    }
    return { error: error.message };
  }

  revalidatePath("/circles");
  return { success: true, message: `Invite sent to ${email}` };
}

export async function acceptCircleInvite(circleId: string) {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("circles_network")
    .update({ status: "accepted" })
    .eq("id", circleId)
    .eq("trusted_peer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/circles");
  return { success: true };
}

export async function getCircleMembers(): Promise<CircleMember[]> {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return [];

  const { data: circles, error } = await supabase
    .from("circles_network")
    .select("*")
    .or(`host_id.eq.${user.id},trusted_peer_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!circles?.length) return [];

  const peerIds = circles.map((c) =>
    c.host_id === user.id ? c.trusted_peer_id : c.host_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", peerIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return circles.map((circle) => {
    const peerId =
      circle.host_id === user.id ? circle.trusted_peer_id : circle.host_id;
    return {
      ...circle,
      peer: profileMap.get(peerId) ?? { id: peerId, full_name: "Unknown Host" },
    };
  });
}

export async function getAvailabilityList(): Promise<AvailabilityProperty[]> {
  const supabase = await createDataClient();
  const user = await getSessionUser();

  if (!user) return [];

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  if (!properties?.length) return [];

  const ownerIds = Array.from(new Set(properties.map((p) => p.owner_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ownerIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("property_id, start_date, end_date")
    .gte("end_date", new Date().toISOString().slice(0, 10));

  const bookingsByProperty = new Map<string, { start_date: string; end_date: string }[]>();
  bookings?.forEach((b) => {
    const list = bookingsByProperty.get(b.property_id) ?? [];
    list.push({ start_date: b.start_date, end_date: b.end_date });
    bookingsByProperty.set(b.property_id, list);
  });

  return properties.map((property) => {
    const isOwn = property.owner_id === user.id;
    const propertyBookings = bookingsByProperty.get(property.id) ?? [];

    const availabilityLabels =
      propertyBookings.length > 0
        ? propertyBookings.slice(0, 3).map(
            (b) =>
              `Booked · ${new Date(b.start_date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}`
          )
        : ["Open · Available now"];

    return {
      id: property.id,
      owner_id: property.owner_id,
      name: property.name,
      zodomus_property_id: property.zodomus_property_id,
      ical_url: property.ical_url ?? null,
      last_synced_at: property.last_synced_at ?? null,
      created_at: property.created_at,
      owner_name: profileMap.get(property.owner_id) ?? null,
      is_own: isOwn,
      mock_availability: availabilityLabels,
    };
  });
}
