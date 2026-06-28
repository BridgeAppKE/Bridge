"use server";

import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getRequestOrigin, isSupabaseConfigured } from "@/lib/env";

export async function signInWithMagicLink(formData: FormData) {
  if (isAuthBypassEnabled()) {
    return {
      success: true,
      message: "Auth is bypassed in dev mode — go to /home",
    };
  }

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured on this server." };
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Check your email for the magic link!" };
}

export async function signOut() {
  if (isAuthBypassEnabled()) {
    redirect("/home");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  return getSessionUser();
}
