"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockDates } from "@/lib/actions/bookings";
import { todayIsoDate } from "@/lib/inventory/consumption";
import type { Property } from "@/lib/types/database";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarOff } from "lucide-react";
import { toast } from "sonner";

interface BlockDatesDialogProps {
  units: Property[];
  defaultPropertyId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  onBlocked?: () => void;
}

export function BlockDatesDialog({
  units,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  onBlocked,
}: BlockDatesDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [propertyId, setPropertyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setPropertyId("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (next) resetForm();
    setOpen(next);
  }

  const today = todayIsoDate();

  function handleSubmit(formData: FormData) {
    if (!propertyId) {
      setError("Choose a unit first.");
      return;
    }
    formData.set("property_id", propertyId);
    setError(null);
    startTransition(async () => {
      const result = await blockDates(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        toast.success("Dates blocked — Circle peers see this now. OTAs update on their next fetch.");
        onBlocked?.();
        router.refresh();
      }
    });
  }

  return (
    <>
      {showTrigger && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
          className="tap-scale gap-1.5"
        >
          <CalendarOff className="h-4 w-4" />
          Block
        </Button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block dates</DialogTitle>
            <DialogDescription>
              Pick a unit, then the dates to mark unavailable.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit to block" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="block-start">From</Label>
                <Input
                  id="block-start"
                  name="start_date"
                  type="date"
                  min={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end">To</Label>
                <Input
                  id="block-end"
                  name="end_date"
                  type="date"
                  min={today}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending || !propertyId} className="w-full">
              {isPending ? "Blocking…" : "Block dates"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
