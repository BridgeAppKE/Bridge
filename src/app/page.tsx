import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { isSupabaseConfigured } from "@/lib/env";

export default async function RootPage() {
  if (!isSupabaseConfigured()) {
    redirect("/setup");
  }

  if (isAuthBypassEnabled()) {
    redirect("/home");
  }

  const user = await getSessionUser();

  if (user) {
    redirect("/home");
  }

  redirect("/login");
}
