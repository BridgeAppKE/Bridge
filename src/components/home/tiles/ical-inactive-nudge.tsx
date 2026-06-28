"use client";

import Link from "next/link";
import { useTransition } from "react";
import { dismissIcalNudge } from "@/lib/actions/ical-feeds";
import { CalendarClock } from "lucide-react";

export function IcalInactiveNudge() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground">
          Calendar inactive: Add your iCal link to prevent double bookings.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/calendar"
            className="text-sm font-semibold text-foreground underline underline-offset-4"
          >
            Set up calendar
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void dismissIcalNudge();
              })
            }
            className="text-sm text-muted-foreground underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
