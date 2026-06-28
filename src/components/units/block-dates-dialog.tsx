"use client";

import { useEffect, useState, useTransition } from "react";
import { blockDates } from "@/lib/actions/bookings";
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

interface BlockDatesDialogProps {
  units: Property[];
  defaultPropertyId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function BlockDatesDialog({
  units,
  defaultPropertyId,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: BlockDatesDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? units[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (defaultPropertyId) setPropertyId(defaultPropertyId);
  }, [defaultPropertyId]);

  const selectedUnit = units.find((u) => u.id === propertyId);

  function handleSubmit(formData: FormData) {
    if (!propertyId) {
      setError("Select a unit.");
      return;
    }
    formData.set("property_id", propertyId);
    setError(null);
    startTransition(async () => {
      const result = await blockDates(formData);
      if (result.error) setError(result.error);
      else {
        setOpen(false);
        window.location.reload();
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
          onClick={() => setOpen(true)}
          className="tap-scale gap-1.5"
        >
          <CalendarOff className="h-4 w-4" />
          Block
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block dates</DialogTitle>
            <DialogDescription>
              Mark dates unavailable on your calendar and for Circle peers.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            {units.length > 1 && (
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
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
            )}
            {units.length === 1 && selectedUnit && (
              <p className="text-sm text-muted-foreground">Unit: {selectedUnit.name}</p>
            )}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="block-start">From</Label>
                <Input id="block-start" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end">To</Label>
                <Input id="block-end" name="end_date" type="date" required />
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
