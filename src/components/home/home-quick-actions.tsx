"use client";

import Link from "next/link";
import { CalendarDays, Camera, Receipt } from "lucide-react";

export function HomeQuickActions() {
  const linkClass =
    "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium sm:flex-none sm:px-4";

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/unit/capture" className={linkClass}>
        <Receipt className="h-3.5 w-3.5" />
        Bulk shop
      </Link>
      <Link href="/unit" className={linkClass}>
        <Camera className="h-3.5 w-3.5" />
        Log spend
      </Link>
      <Link href="/calendar" className={linkClass}>
        <CalendarDays className="h-3.5 w-3.5" />
        Calendar
      </Link>
    </div>
  );
}
