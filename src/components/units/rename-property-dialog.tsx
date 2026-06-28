"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { updatePropertyDetails, deleteProperty } from "@/lib/actions/properties";
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
import { toast } from "sonner";

interface EditUnitDialogProps {
  propertyId: string;
  currentName: string;
  currentBaseRateKes: number;
  trigger?: "icon" | "text";
}

export function EditUnitDialog({
  propertyId,
  currentName,
  currentBaseRateKes,
  trigger = "icon",
}: EditUnitDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [baseRate, setBaseRate] = useState(String(currentBaseRateKes || 8500));
  const [isPending, startTransition] = useTransition();

  function openDialog() {
    setName(currentName);
    setBaseRate(String(currentBaseRateKes || 8500));
    setOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePropertyDetails(propertyId, {
        name,
        baseRateKes: parseFloat(baseRate),
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Unit updated");
        setOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${currentName}"? Bookings and inventory for this unit will be removed.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProperty(propertyId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Unit deleted");
        setOpen(false);
        router.push("/unit");
        router.refresh();
      }
    });
  }

  return (
    <>
      {trigger === "icon" ? (
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Edit unit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={openDialog}>
          Edit
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit unit</DialogTitle>
            <DialogDescription>Name and nightly rate used for revenue estimates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Display name</Label>
              <Input
                id="unit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={48}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-rate">Nightly rate (KES)</Label>
              <Input
                id="unit-rate"
                type="number"
                inputMode="decimal"
                min={1}
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                placeholder="8500"
              />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={isPending || !name.trim()}
              onClick={handleSave}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete unit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** @deprecated use EditUnitDialog */
export const RenamePropertyDialog = EditUnitDialog;
