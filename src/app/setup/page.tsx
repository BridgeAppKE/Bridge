import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured, getRequestOrigin, getSiteUrl } from "@/lib/env";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";

export default async function SetupPage() {
  const configured = isSupabaseConfigured();
  const requestOrigin = await getRequestOrigin();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>EliteHost deployment setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configured ? (
            <p className="text-sm text-muted-foreground">
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
        </CardContent>
      </Card>
    </main>
  );
}
