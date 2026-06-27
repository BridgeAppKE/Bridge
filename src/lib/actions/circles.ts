"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserIdByEmail } from "@/lib/supabase/admin";
import type { AvailabilityProperty, CircleMember } from "@/lib/types/database";

const MOCK_DATES = ["Jun 28", "Jun 29", "Jul 1", "Jul 3", "Jul 5"];

export async function inviteToCircle(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return properties.map((property) => {
    const isOwn = property.owner_id === user.id;
    const offset = property.id.charCodeAt(0) % 3;

    return {
      id: property.id,
      owner_id: property.owner_id,
      name: property.name,
      zodomus_property_id: property.zodomus_property_id,
      created_at: property.created_at,
      owner_name: profileMap.get(property.owner_id) ?? null,
      is_own: isOwn,
      mock_availability: MOCK_DATES.slice(offset, offset + 3),
    };
  });
}
