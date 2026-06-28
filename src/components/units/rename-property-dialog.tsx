"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updatePropertyName } from "@/lib/actions/properties";
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

interface RenamePropertyDialogProps {
  propertyId: string;
  currentName: string;
  trigger?: "icon" | "text";
}

export function RenamePropertyDialog({
  propertyId,
  currentName,
  trigger = "icon",
}: RenamePropertyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updatePropertyName(propertyId, name);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Unit renamed");
        setOpen(false);
      }
    });
  }

  return (
    <>
      {trigger === "icon" ? (
        <button
          type="button"
          onClick={() => {
            setName(currentName);
            setOpen(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Rename unit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setName(currentName);
            setOpen(true);
          }}
        >
          Rename
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename unit</DialogTitle>
            <DialogDescription>
              Short names work best in the header and alerts.
            </DialogDescription>
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
            <Button
              type="button"
              className="w-full"
              disabled={isPending || !name.trim()}
              onClick={handleSave}
            >
              {isPending ? "Saving…" : "Save name"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
