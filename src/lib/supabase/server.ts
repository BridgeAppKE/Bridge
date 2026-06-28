import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";
import { isAuthBypassEnabled, getDevUser } from "@/lib/auth/bypass";
import { createServiceClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export async function createClient() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — middleware handles refresh.
        }
      },
    },
  });
}

/** DB client — service role when auth bypass is on (skips RLS). */
export async function createDataClient() {
  if (isAuthBypassEnabled()) {
    return createServiceClient();
  }
  return createClient();
}

export async function getSessionUser(): Promise<User | null> {
  if (isAuthBypassEnabled()) {
    return getDevUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
