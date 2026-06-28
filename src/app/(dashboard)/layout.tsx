import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DevAuthBanner } from "@/components/layout/dev-auth-banner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageMotion } from "@/components/layout/page-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { Toaster } from "@/components/ui/sonner";
import { wireAppShellClass } from "@/lib/design/tokens";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={wireAppShellClass}>
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <Link
            href="/home"
            className="text-lg font-semibold text-foreground"
          >
            Elite<span className="text-primary">Host</span>
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
      </header>

      <DevAuthBanner />

      <main className="flex-1 px-4 py-5 pb-24 md:px-6">
        <PageMotion>{children}</PageMotion>
      </main>

      <BottomNav />
      <Toaster richColors position="top-center" />
    </div>
  );
}
