"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Upload } from "lucide-react";
import { createExpense, parseReceiptFromUpload, uploadReceipt } from "@/lib/actions/expenses-v2";
import { consumeReceiptOcrCredit } from "@/lib/actions/receipt-ocr";
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
import { toast } from "sonner";

interface ReceiptCaptureProps {
  propertyId: string;
  ocrRemaining: number;
  ocrLimit: number;
}

export function ReceiptCapture({
  propertyId,
  ocrRemaining,
  ocrLimit,
}: ReceiptCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(ocrRemaining);
  const [isPending, startTransition] = useTransition();

  async function processFile(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const upload = await uploadReceipt(formData);
    if (upload.error) {
      toast.error(upload.error);
      return;
    }
    setReceiptPath(upload.path ?? null);

    if (remaining > 0) {
      const credit = await consumeReceiptOcrCredit();
      if (credit.ok) {
        setRemaining(credit.remaining);
        const parsed = await parseReceiptFromUpload(file.name);
        if (parsed.amount) setAmount(String(parsed.amount));
        if (parsed.vendor_name) setVendor(parsed.vendor_name);
      }
    }
  }

  function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("property_id", propertyId);
      formData.set("amount_kes", String(parsedAmount));
      formData.set("category", category);
      formData.set("date", new Date().toISOString().slice(0, 10));
      if (vendor) formData.set("vendor_name", vendor);
      if (receiptPath) formData.set("receipt_url", receiptPath);

      const result = await createExpense(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Expense saved");
        setAmount("");
        setVendor("");
        setReceiptPath(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {remaining > 0
          ? `${remaining} of ${ocrLimit} receipt scans left this month`
          : "OCR limit reached — upload only, enter amount manually"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="default"
          className="h-auto flex-col gap-2 py-6"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-8 w-8" />
          Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto flex-col gap-2 py-6"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8" />
          Choose file
        </Button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
        }}
      />

      {receiptPath && (
        <p className="text-xs text-muted-foreground">Receipt attached</p>
      )}

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (KES)</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor (optional)</Label>
          <Input
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Naivas, Carrefour…"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Supplies", "Cleaning", "Utilities", "Maintenance", "Staff", "Other"].map(
                (c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" className="w-full" onClick={handleSave} disabled={isPending}>
          Save expense
        </Button>
      </div>
    </div>
  );
}
