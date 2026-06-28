"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CircleDot,
  Home,
  Package,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/circles", label: "Circles", icon: CircleDot },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav className="glass-panel pointer-events-auto flex items-center gap-1 rounded-full px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className="relative tap-scale">
              {active && (
                <motion.div
                  layoutId="dock-pill"
                  className="absolute inset-0 rounded-full border border-emerald-500/20 bg-emerald-500/15 dark:border-emerald-400/20 dark:bg-emerald-400/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-full px-3 py-2",
                  "text-[10px] font-medium tracking-wide transition-colors duration-300",
                  active
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
