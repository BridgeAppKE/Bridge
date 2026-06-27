"use client";

import { useRef, useState, useTransition } from "react";
import { createExpense, uploadReceipt } from "@/lib/actions/expenses";
import type { Property } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Upload } from "lucide-react";

interface ExpenseFormProps {
  properties: Property[];
  categories: readonly string[];
}

export function ExpenseForm({ properties, categories }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!properties.length) {
    return (
      <Button disabled size="lg" className="w-full">
        Add a property first
      </Button>
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadReceipt(formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setReceiptUrl(result.url);
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    formData.set("category", category);
    if (receiptUrl) formData.set("receipt_url", receiptUrl);

    setError(null);
    startTransition(async () => {
      const result = await createExpense(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setReceiptUrl(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <>
      <Button
        size="lg"
        className="h-16 w-full gap-2 bg-emerald-600 text-lg hover:bg-emerald-700"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
        Add Expense
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>
            Track costs in KES. Optionally attach a receipt photo.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount_kes">Amount (KES)</Label>
            <Input
              id="amount_kes"
              name="amount_kes"
              type="number"
              min="1"
              step="1"
              placeholder="3500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {uploading && (
              <p className="text-xs text-muted-foreground">Uploading…</p>
            )}
            {receiptUrl && (
              <p className="text-xs text-emerald-600">Receipt attached ✓</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isPending || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? "Saving…" : "Save Expense"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
