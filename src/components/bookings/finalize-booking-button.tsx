"use client";

import { useTransition } from "react";
import { finalizeBooking } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface FinalizeBookingButtonProps {
  bookingId: string;
  guestCount?: number;
}

export function FinalizeBookingButton({
  bookingId,
  guestCount = 2,
}: FinalizeBookingButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await finalizeBooking(bookingId, guestCount);
        })
      }
      className="tap-scale h-8 gap-1 px-2 text-xs"
      title="Finalize stay and deduct inventory"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {isPending ? "…" : "Finalize"}
    </Button>
  );
}
