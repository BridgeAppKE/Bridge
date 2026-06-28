import { isSupabaseConfigured, getRequestOrigin, getSiteUrl } from "@/lib/env";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";

export default async function SetupPage() {
  const configured = isSupabaseConfigured();
  const requestOrigin = await getRequestOrigin();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="glass-panel w-full max-w-md space-y-4 p-6">
        <h1 className="text-xl font-bold text-foreground">EliteHost deployment setup</h1>
        {configured ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Supabase environment variables are detected. Reload the app.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Supabase is not configured on this server. Add these variables in
              Railway → your service → Variables, then redeploy.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
              <li>NEXT_PUBLIC_SITE_URL (your Railway URL)</li>
            </ul>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Auth bypass: {isAuthBypassEnabled() ? "ON (dev mode)" : "off"}
        </p>
        <p className="text-xs text-muted-foreground">
          Magic link redirect: {requestOrigin}/auth/callback
        </p>
        <p className="text-xs text-muted-foreground">
          Env fallback URL: {getSiteUrl()}
        </p>
      </div>
    </main>
  );
}
