import Link from "next/link";
import { lookupHostByCode } from "@/lib/actions/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JoinCirclePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const host = await lookupHostByCode(code);

  if (!host || "error" in host || !("success" in host)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
            <CardDescription>
              This invite link or code is not valid. Ask your host for a fresh link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Join {host.displayName}&apos;s Circle</CardTitle>
          <CardDescription>
            Connect on EliteHost to share availability when units are full — overflow bookings
            across trusted hosts in Kenya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {host.unitCount ?? 0} active unit
            {(host.unitCount ?? 0) === 1 ? "" : "s"} on EliteHost
          </p>
          <Link
            href={`/login?join=${encodeURIComponent(code)}`}
            className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
          >
            Sign up to join
          </Link>
          <Link
            href="/login"
            className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium"
          >
            Already have an account? Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
