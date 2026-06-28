"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, Home, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home, center: false },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, center: false },
  { href: "/circles", label: "Circles", icon: Users, center: true },
  { href: "/unit", label: "Unit", icon: Building2, center: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/unit") {
      return pathname === "/unit" || pathname.startsWith("/unit/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2">
        {navItems.map(({ href, label, icon: Icon, center }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "tap-scale relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5",
                "text-[10px] font-medium transition-colors",
                center && "-mt-3",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && !center && (
                <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary" />
              )}
              <span
                className={cn(
                  "flex items-center justify-center rounded-full transition-colors",
                  center && "h-12 w-12 bg-primary text-primary-foreground shadow-md",
                  center && active && "ring-2 ring-primary/30",
                  center && !active && "bg-primary/90 text-primary-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", center && "h-6 w-6")} strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className={cn(center && "font-semibold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
