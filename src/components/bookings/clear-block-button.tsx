"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearManualBlock } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ClearBlockButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      const result = await clearManualBlock(bookingId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Block removed — dates open in Circles now");
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={handleClear}
    >
      {isPending ? "Clearing…" : "Clear block"}
    </Button>
  );
}
