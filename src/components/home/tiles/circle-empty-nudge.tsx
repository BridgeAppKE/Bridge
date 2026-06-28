"use client";

import Link from "next/link";
import { useTransition } from "react";
import { dismissCircleNudge } from "@/lib/actions/onboarding";
import { Users } from "lucide-react";

export function CircleEmptyNudge() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <Users className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground">
          Your circle is empty — invite a neighbour to unlock overflow bookings.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/circles"
            className="text-sm font-semibold text-foreground underline underline-offset-4"
          >
            Invite a host
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void dismissCircleNudge();
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
