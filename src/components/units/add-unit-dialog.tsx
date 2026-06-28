"use client";

import { useState, useTransition } from "react";
import { createUnit } from "@/lib/actions/properties";
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
import { Plus } from "lucide-react";

export function AddUnitDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createUnit(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="tap-scale gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Unit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
            <DialogDescription>
              Register a rental unit. Optionally link an iCal feed for sync.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Unit name</Label>
              <Input id="unit-name" name="name" required placeholder="Westlands Studio" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ical_url">iCal URL (optional)</Label>
              <Input id="ical_url" name="ical_url" type="url" placeholder="https://..." />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving…" : "Create Unit"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
