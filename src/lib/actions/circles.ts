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

export type PeerAvailabilityRow = {
  property_id: string;
  property_name: string;
  host_name: string;
  bedrooms: number;
  is_own: boolean;
  is_available: boolean;
};

function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export async function searchPeerAvailability(
  checkIn: string,
  checkOut: string
): Promise<PeerAvailabilityRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();

  const { data: memberships } = await supabase
    .from("circle_members")
    .select("circle_id")
    .eq("profile_id", user.id);

  let circleIds = memberships?.map((m) => m.circle_id) ?? [];
  if (!circleIds.length) {
    const id = await ensureDefaultCircle(user.id, supabase);
    circleIds = [id];
  }

  const { data: members } = await supabase
    .from("circle_members")
    .select("profile_id, circle_id")
    .in("circle_id", circleIds);

  const visibleOwnerIds = new Set(members?.map((m) => m.profile_id) ?? []);
  visibleOwnerIds.add(user.id);

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, owner_id, bedrooms")
    .in("owner_id", Array.from(visibleOwnerIds))
    .order("name");

  if (error) throw new Error(error.message);
  if (!properties?.length) return [];

  const ownerIds = Array.from(new Set(properties.map((p) => p.owner_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, legal_name")
    .in("id", ownerIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.id, p.legal_name ?? p.full_name ?? "Host"]) ?? []
  );

  const propertyIds = properties.map((p) => p.id);
  const { data: bookings } = await supabase
    .from("bookings")
    .select("property_id, start_date, end_date, is_manual_block")
    .in("property_id", propertyIds);

  return properties.map((property) => {
    const propertyBookings = (bookings ?? []).filter(
      (b) => b.property_id === property.id
    );
    const hasConflict = propertyBookings.some((b) =>
      datesOverlap(checkIn, checkOut, b.start_date, b.end_date)
    );

    return {
      property_id: property.id,
      property_name: property.name,
      host_name: profileMap.get(property.owner_id) ?? "Host",
      bedrooms: (property as { bedrooms?: number }).bedrooms ?? 1,
      is_own: property.owner_id === user.id,
      is_available: !hasConflict,
    };
  }).filter((row) => row.is_available && !row.is_own);
}

export async function getCircleInviteUrl(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createDataClient();
  const circleId = await ensureDefaultCircle(user.id, supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("short_code")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.short_code) {
    const { getRequestOrigin } = await import("@/lib/env");
    const origin = await getRequestOrigin();
    return `${origin}/join/${profile.short_code}`;
  }

  const { data: tokenRow, error } = await supabase
    .from("circle_invite_tokens")
    .insert({ inviter_id: user.id, circle_id: circleId })
    .select("token")
    .single();

  if (error) return null;

  const { getRequestOrigin } = await import("@/lib/env");
  const origin = await getRequestOrigin();
  return `${origin}/join/${tokenRow.token}`;
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

export async function getCirclePeerHighlights(): Promise<
  { id: string; name: string; status: string; unitsAvailable: number }[]
> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createDataClient();
  const { data: memberships } = await supabase
    .from("circle_members")
    .select("circle_id")
    .eq("profile_id", user.id);

  const circleIds = memberships?.map((m) => m.circle_id) ?? [];
  if (!circleIds.length) return [];

  const { data: members } = await supabase
    .from("circle_members")
    .select("profile_id")
    .in("circle_id", circleIds);

  const peerIds = Array.from(
    new Set((members ?? []).map((m) => m.profile_id).filter((id) => id !== user.id))
  );
  if (!peerIds.length) return [];

  const [{ data: profiles }, { data: properties }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, legal_name").in("id", peerIds),
    supabase.from("properties").select("id, owner_id, location").in("owner_id", peerIds),
  ]);

  const propertyIds = properties?.map((p) => p.id) ?? [];
  const { data: bookings } = propertyIds.length
    ? await supabase
        .from("bookings")
        .select("property_id, start_date, end_date")
        .in("property_id", propertyIds)
    : { data: [] as { property_id: string; start_date: string; end_date: string }[] };

  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date();
  weekOut.setDate(weekOut.getDate() + 7);
  const checkOut = weekOut.toISOString().slice(0, 10);

  return peerIds.map((peerId) => {
    const profile = profiles?.find((p) => p.id === peerId);
    const peerProps = properties?.filter((p) => p.owner_id === peerId) ?? [];
    const openUnits = peerProps.filter((prop) => {
      const conflicts = (bookings ?? []).filter((b) => b.property_id === prop.id);
      return !conflicts.some((b) =>
        datesOverlap(today, checkOut, b.start_date, b.end_date)
      );
    }).length;

    const locationList = peerProps
      .map((p) => (p as { location?: string }).location)
      .filter((loc): loc is string => Boolean(loc));
    const locations = Array.from(new Set(locationList));

    return {
      id: peerId,
      name: profile?.legal_name ?? profile?.full_name ?? "Circle Host",
      unitsAvailable: openUnits,
      status:
        locations.length > 0
          ? locations.slice(0, 2).join(" · ")
          : `${peerProps.length} unit${peerProps.length === 1 ? "" : "s"}`,
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
