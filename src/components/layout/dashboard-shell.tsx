"use client";

import Link from "next/link";
import type { Property } from "@/lib/types/database";
import { BottomNav } from "@/components/layout/bottom-nav";
import { UnitContextProvider } from "@/components/layout/unit-context";
import { UnitSelector } from "@/components/layout/unit-selector";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { appShellClass } from "@/lib/design/tokens";

interface DashboardShellProps {
  properties: Property[];
  showSignOut: boolean;
  signOutAction: () => Promise<void>;
  devBanner: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  properties,
  showSignOut,
  signOutAction,
  devBanner,
  children,
}: DashboardShellProps) {
  return (
    <UnitContextProvider properties={properties}>
      <div className={appShellClass}>
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between gap-2 px-4 py-3 md:px-6">
            <Link href="/home" className="shrink-0 text-lg font-semibold tracking-tight">
              EliteHost
            </Link>
            <UnitSelector />
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              {showSignOut && (
                <form action={signOutAction}>
                  <Button variant="ghost" size="sm" type="submit">
                    Sign out
                  </Button>
                </form>
              )}
            </div>
          </div>
          <Separator />
        </header>

        {devBanner}

        <main className="flex-1 px-4 py-6 pb-24 md:px-6">{children}</main>

        <BottomNav />
      </div>
    </UnitContextProvider>
  );
}
