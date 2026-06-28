"use client";

import { useState, useTransition } from "react";
import { broadcastInquiry } from "@/lib/actions/broadcasts";
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

const UNIT_TYPES = [
  "Studio",
  "1 Bedroom",
  "2 Bedroom",
  "3+ Bedroom",
  "Entire Home",
];

interface BroadcastInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastInquiryDialog({
  open,
  onOpenChange,
}: BroadcastInquiryDialogProps) {
  const [unitType, setUnitType] = useState(UNIT_TYPES[1]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("unit_type", unitType);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await broadcastInquiry(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(result.message ?? "Inquiry broadcast to your Circle.");
        setTimeout(() => onOpenChange(false), 1500);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-emerald-950/95 text-emerald-50 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="tracking-wide text-emerald-50">
            Broadcast Inquiry
          </DialogTitle>
          <DialogDescription className="text-emerald-200/80">
            Guest dates you can&apos;t fill? Notify your Circle instantly.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="check_in" className="text-emerald-200">
                Check-in
              </Label>
              <Input
                id="check_in"
                name="check_in"
                type="date"
                required
                className="border-white/10 bg-white/5 text-emerald-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out" className="text-emerald-200">
                Check-out
              </Label>
              <Input
                id="check_out"
                name="check_out"
                type="date"
                required
                className="border-white/10 bg-white/5 text-emerald-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_count" className="text-emerald-200">
              Guest count
            </Label>
            <Input
              id="guest_count"
              name="guest_count"
              type="number"
              min="1"
              defaultValue="2"
              required
              className="border-white/10 bg-white/5 text-emerald-50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-emerald-200">Unit type</Label>
            <Select value={unitType} onValueChange={(v) => v && setUnitType(v)}>
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-emerald-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-emerald-950 text-emerald-50">
                {UNIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-emerald-200">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Budget, location preference, special requests…"
              className="border-white/10 bg-white/5 text-emerald-50 placeholder:text-emerald-200/40"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-400 font-semibold tracking-wide text-emerald-950 hover:bg-emerald-300"
          >
            {isPending ? "Sending…" : "Send to Circle"}
          </Button>

          {message && (
            <p className="text-center text-sm text-emerald-300">{message}</p>
          )}
          {error && (
            <p className="text-center text-sm text-red-300">{error}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
