import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";

export function isAuthBypassEnabled(): boolean {
  return process.env.BYPASS_AUTH === "true";
}

let cachedDevUserId: string | null = null;

export async function resolveDevUserId(): Promise<string> {
  if (process.env.DEV_USER_ID) {
    return process.env.DEV_USER_ID;
  }

  if (cachedDevUserId) {
    return cachedDevUserId;
  }

  const admin = createServiceClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (profile?.id) {
    cachedDevUserId = profile.id;
    return profile.id;
  }

  const { data: authData, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  const firstUser = authData?.users[0];
  if (firstUser?.id) {
    cachedDevUserId = firstUser.id;
    return firstUser.id;
  }

  throw new Error(
    "BYPASS_AUTH is enabled but no DEV_USER_ID was set and no users exist in Supabase."
  );
}

export async function getDevUser(): Promise<User> {
  const id = await resolveDevUserId();
  return {
    id,
    email: "dev-bypass@elitehost.local",
    app_metadata: {},
    user_metadata: { full_name: "Dev Host" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}
