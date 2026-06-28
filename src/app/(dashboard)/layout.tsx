import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DevAuthBanner } from "@/components/layout/dev-auth-banner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageMotion } from "@/components/layout/page-motion";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col bg-background">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.08)_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.08)_0%,_transparent_50%)]"
        aria-hidden
      />

      <header className="relative z-40 px-4 pt-4 md:px-6">
        <div className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3">
          <Link
            href="/home"
            className="text-lg font-semibold tracking-wide text-foreground"
          >
            Elite<span className="text-emerald-500 dark:text-emerald-400">Host</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {!isAuthBypassEnabled() && (
              <form action={signOut}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="text-muted-foreground hover:bg-glass hover:text-foreground"
                >
                  Sign out
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <DevAuthBanner />

      <main className="relative z-10 flex-1 p-4 pb-28 md:p-6 md:pb-32">
        <PageMotion>{children}</PageMotion>
      </main>

      <BottomNav />
      <Toaster richColors position="top-center" />
    </div>
  );
}
