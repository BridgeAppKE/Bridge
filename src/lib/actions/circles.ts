"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import { getUserIdByEmail } from "@/lib/supabase/admin";
import type { AvailabilityProperty } from "@/lib/types/database";

export type CircleInvitationRow = {
  id: string;
  circle_id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  circle_name: string;
  peer: { id: string; full_name: string | null };
  direction: "incoming" | "outgoing";
};

export type CircleGroup = {
  id: string;
  name: string;
  member_count: number;
};

async function ensureDefaultCircle(userId: string, supabase: Awaited<ReturnType<typeof createDataClient>>) {
  const { data: existing } = await supabase
    .from("circle_members")
    .select("circle_id, circles(id, name)")
    .eq("profile_id", userId)
    .limit(1);

  if (existing?.length) {
    const circles = existing[0].circles;
    const row = (Array.isArray(circles) ? circles[0] : circles) as
      | { id: string; name: string }
      | null;
    if (row?.id) return row.id;
  }

  const { data: circle, error } = await supabase
    .from("circles")
    .insert({ name: "Primary Circle", created_by: userId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("circle_members").insert({
    circle_id: circle.id,
    profile_id: userId,
  });

  return circle.id;
}

export async function getMyCircles(): Promise<CircleGroup[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("circle_members")
    .select("circle_id, circles(id, name)")
    .eq("profile_id", user.id);

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }

  const circles = await Promise.all(
    (data ?? []).map(async (row) => {
      const circles = row.circles;
      const circle = (Array.isArray(circles) ? circles[0] : circles) as {
        id: string;
        name: string;
      };
      const { count } = await supabase
        .from("circle_members")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circle.id);
      return {
        id: circle.id,
        name: circle.name,
        member_count: count ?? 0,
      };
    })
  );

  return circles;
}

export async function getCircleInvitations(): Promise<CircleInvitationRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("circle_invitations")
    .select("*, circles(name)")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }

  if (!data?.length) return [];

  const peerIds = data.map((inv) =>
    inv.sender_id === user.id ? inv.receiver_id : inv.sender_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, legal_name")
    .in("id", peerIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.id, p.legal_name ?? p.full_name]) ?? []
  );

  return data.map((inv) => {
    const peerId = inv.sender_id === user.id ? inv.receiver_id : inv.sender_id;
    const circles = inv.circles;
    const circle = (Array.isArray(circles) ? circles[0] : circles) as
      | { name: string }
      | null;
    return {
      id: inv.id,
      circle_id: inv.circle_id,
      sender_id: inv.sender_id,
      receiver_id: inv.receiver_id,
      status: inv.status,
      created_at: inv.created_at,
      circle_name: circle?.name ?? "Circle",
      peer: {
        id: peerId,
        full_name: profileMap.get(peerId) ?? "Host",
      },
      direction: inv.receiver_id === user.id ? "incoming" : "outgoing",
    };
  });
}

export async function lookupHostByCode(code: string) {
  const { lookupHostByCode: lookup } = await import("@/lib/actions/onboarding");
  return lookup(code);
}

export async function inviteToCircleByCode(code: string, circleId?: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { data: lookup, error: lookupError } = await supabase.rpc("lookup_host_by_code", {
    code: code.trim(),
  });

  if (lookupError) return { error: lookupError.message };
  const row = Array.isArray(lookup) ? lookup[0] : lookup;
  if (!row) return { error: "No host found with that code." };

  const receiverId = row.profile_id as string;
  if (receiverId === user.id) return { error: "You cannot invite yourself." };

  const targetCircleId = circleId ?? (await ensureDefaultCircle(user.id, supabase));

  const { error } = await supabase.from("circle_invitations").insert({
    circle_id: targetCircleId,
    sender_id: user.id,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Invite already sent." };
    return { error: error.message };
  }

  revalidatePath("/circles");
  return { success: true, message: `Invite sent to ${row.display_name}.` };
}

export async function inviteToCircle(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const circleId = (formData.get("circle_id") as string) || undefined;

  if (!email) return { error: "Email is required" };

  const user = await getSessionUser();
  if (!user) return { error: "You must be logged in" };

  let peerId: string | null;
  try {
    peerId = await getUserIdByEmail(email);
  } catch (lookupError) {
    return {
      error: lookupError instanceof Error ? lookupError.message : "Failed to look up user",
    };
  }

  if (!peerId) {
    return {
      error: "No account found with that email. Ask them to sign up first.",
    };
  }

  const supabase = await createDataClient();
  const targetCircleId = circleId ?? (await ensureDefaultCircle(user.id, supabase));

  const { error } = await supabase.from("circle_invitations").insert({
    circle_id: targetCircleId,
    sender_id: user.id,
    receiver_id: peerId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "An invite already exists." };
    return { error: error.message };
  }

  revalidatePath("/circles");
  return { success: true, message: `Invite sent to ${email}` };
}

export async function respondToCircleInvite(
  invitationId: string,
  action: "accepted" | "rejected"
) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();

  const { data: inv, error: fetchError } = await supabase
    .from("circle_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("receiver_id", user.id)
    .single();

  if (fetchError || !inv) return { error: "Invitation not found" };

  const { error } = await supabase
    .from("circle_invitations")
    .update({ status: action })
    .eq("id", invitationId);

  if (error) return { error: error.message };

  if (action === "accepted") {
    await supabase.from("circle_members").upsert(
      { circle_id: inv.circle_id, profile_id: user.id },
      { onConflict: "circle_id,profile_id" }
    );
  }

  revalidatePath("/circles");
  return { success: true };
}

export async function acceptCircleInvite(invitationId: string) {
  return respondToCircleInvite(invitationId, "accepted");
}

export async function getCircleMembers() {
  const invitations = await getCircleInvitations();
  return invitations.filter((i) => i.status === "accepted" || i.status === "pending");
}

export async function getAvailabilityList(circleId?: string): Promise<AvailabilityProperty[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();

  let visibleOwnerIds: Set<string> | null = null;

  if (circleId) {
    const { data: members } = await supabase
      .from("circle_members")
      .select("profile_id")
      .eq("circle_id", circleId);

    visibleOwnerIds = new Set(members?.map((m) => m.profile_id) ?? []);
    visibleOwnerIds.add(user.id);
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  if (!properties?.length) return [];

  const filtered = circleId && visibleOwnerIds
    ? properties.filter((p) => visibleOwnerIds!.has(p.owner_id))
    : properties;

  const ownerIds = Array.from(new Set(filtered.map((p) => p.owner_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, legal_name")
    .in("id", ownerIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.id, p.legal_name ?? p.full_name]) ?? []
  );

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

  return filtered.map((property) => {
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
      ...property,
      owner_name: profileMap.get(property.owner_id) ?? null,
      is_own: isOwn,
      mock_availability: availabilityLabels,
    };
  });
}

export async function createCircle(name: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from("circles")
    .insert({ name: name.trim() || "New Circle", created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("circle_members").insert({
    circle_id: data.id,
    profile_id: user.id,
  });

  revalidatePath("/circles");
  return { success: true, circleId: data.id };
}
