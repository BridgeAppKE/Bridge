"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualBooking } from "@/lib/actions/bookings";
import { todayIsoDate } from "@/lib/inventory/consumption";
import type { Property } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

interface AddBookingDialogProps {
  units: Property[];
  defaultPropertyId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  onAdded?: () => void;
}

const BEDROOM_TYPES = ["Studio", "1BR", "2BR", "3BR"];
const PAYMENT_METHODS = ["M-Pesa", "Cash", "Bank Transfer"];

export function AddBookingDialog({
  units,
  defaultPropertyId,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  onAdded,
}: AddBookingDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? "");
  const [bedroomType, setBedroomType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = todayIsoDate();

  function resetForm() {
    setPropertyId(defaultPropertyId ?? "");
    setBedroomType("");
    setPaymentMethod("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (next) resetForm();
    setOpen(next);
  }

  function handleSubmit(formData: FormData) {
    if (!propertyId) {
      setError("Choose a unit first.");
      return;
    }
    formData.set("property_id", propertyId);
    if (bedroomType) formData.set("bedroom_type", bedroomType);
    if (paymentMethod) formData.set("payment_method", paymentMethod);
    setError(null);
    startTransition(async () => {
      const result = await createManualBooking(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        toast.success("Booking added");
        onAdded?.();
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
          <CalendarPlus className="h-4 w-4" />
          Add booking
        </Button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add booking</DialogTitle>
            <DialogDescription>
              For guests booked directly — phone, walk-in, or another channel.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-3">
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

            <div className="space-y-2">
              <Label htmlFor="guest-name">Guest name</Label>
              <Input id="guest-name" name="guest_name" required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone number</Label>
              <Input id="guest-phone" name="guest_phone" type="tel" placeholder="07XX XXX XXX" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="booking-start">Check-in</Label>
                <Input id="booking-start" name="start_date" type="date" min={today} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-end">Check-out</Label>
                <Input id="booking-end" name="end_date" type="date" min={today} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bedroom type</Label>
              <Select value={bedroomType} onValueChange={(v) => v && setBedroomType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BEDROOM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="booking-amount">Amount (KES)</Label>
                <Input id="booking-amount" name="amount_kes" type="number" inputMode="decimal" min={0} />
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes (optional)</Label>
              <Textarea id="booking-notes" name="notes" rows={2} />
            </div>

            <Button type="submit" disabled={isPending || !propertyId} className="w-full">
              {isPending ? "Saving…" : "Add booking"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
