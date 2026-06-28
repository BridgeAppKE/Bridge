"use client";

import { useRef, useState, useTransition } from "react";
import {
  createExpense,
  parseMpesaStatement,
  uploadReceipt,
} from "@/lib/actions/expenses-v2";
import type { Property } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [amount, setAmount] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [mpesaRef, setMpesaRef] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!properties.length) {
    return (
      <Button disabled size="lg" className="w-full">
        Add a unit first
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
      if (result.parsed?.amount) setAmount(String(result.parsed.amount));
      if (result.parsed?.vendor_name) setVendorName(result.parsed.vendor_name);
    }
  }

  function handleMpesaPaste(text: string) {
    startTransition(async () => {
      const parsed = await parseMpesaStatement(text);
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.reference) setMpesaRef(parsed.reference);
      if (parsed.vendorHint) setVendorName(parsed.vendorHint);
    });
  }

  function handleSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    formData.set("category", category);
    if (receiptUrl) formData.set("receipt_url", receiptUrl);
    if (vendorName) formData.set("vendor_name", vendorName);
    if (mpesaRef) formData.set("mpesa_reference_code", mpesaRef);

    setError(null);
    startTransition(async () => {
      const result = await createExpense(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setReceiptUrl(null);
        setAmount("");
        setVendorName("");
        setMpesaRef("");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <>
      <Button
        size="lg"
        className="h-16 w-full gap-2 text-lg"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
        Add Expense
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
            <DialogDescription>
              Paste M-Pesa SMS, upload a receipt, or enter manually. Review before saving.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>M-Pesa paste (optional)</Label>
              <Textarea
                placeholder="Paste M-Pesa confirmation SMS…"
                rows={3}
                onBlur={(e) => e.target.value && handleMpesaPaste(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor (optional)</Label>
              <Input
                id="vendor_name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Supermarket, plumber…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpesa_ref">M-Pesa reference (optional)</Label>
              <Input
                id="mpesa_ref"
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value)}
                placeholder="QGH1ABC123"
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
                <p className="text-xs text-muted-foreground">Receipt attached — review fields above</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending || uploading}
              className="w-full"
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
