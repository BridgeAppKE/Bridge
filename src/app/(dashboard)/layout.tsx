import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DevAuthBanner } from "@/components/layout/dev-auth-banner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageMotion } from "@/components/layout/page-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/lib/actions/auth";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { isOnboardingComplete } from "@/lib/actions/onboarding";
import { Toaster } from "@/components/ui/sonner";
import { appShellClass } from "@/lib/design/tokens";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingDone = await isOnboardingComplete();
  if (!onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <div className={appShellClass}>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <Link href="/home" className="text-lg font-semibold tracking-tight">
            EliteHost
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {!isAuthBypassEnabled() && (
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            )}
          </div>
        </div>
        <Separator />
      </header>

      <DevAuthBanner />

      <main className="flex-1 px-4 py-6 pb-24 md:px-6">
        <PageMotion>{children}</PageMotion>
      </main>

      <BottomNav />
      <Toaster richColors position="top-center" />
    </div>
  );
}
