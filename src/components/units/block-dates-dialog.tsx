"use client";

import { useState, useTransition } from "react";
import { blockDates } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarOff } from "lucide-react";

interface BlockDatesDialogProps {
  propertyId: string;
  propertyName: string;
}

export function BlockDatesDialog({ propertyId, propertyName }: BlockDatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    setError(null);
    startTransition(async () => {
      const result = await blockDates(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="tap-scale gap-2"
      >
        <CalendarOff className="h-4 w-4" />
        Block Dates
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block Dates</DialogTitle>
            <DialogDescription>
              Mark {propertyName} unavailable for Circle members immediately.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="block-start">From</Label>
                <Input id="block-start" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end">To</Label>
                <Input id="block-end" name="end_date" type="date" required />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Blocking…" : "Block Dates"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
