"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createExpense,
  parseMpesaStatement,
} from "@/lib/actions/expenses-v2";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/constants";
import type { MpesaParseResult } from "@/lib/parsers/expense-parsers";
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
import { toast } from "sonner";

const CATEGORIES = EXPENSE_CATEGORIES;

interface ManualExpenseFormProps {
  propertyId: string;
  captureHref?: string;
}

export function ManualExpenseForm({ propertyId, captureHref }: ManualExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [mpesaRef, setMpesaRef] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Supplies");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mpesaPreview, setMpesaPreview] = useState<MpesaParseResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMpesaPaste(text: string) {
    if (!text.trim()) return;
    startTransition(async () => {
      const parsed = await parseMpesaStatement(text);
      if (!parsed.amount && !parsed.reference) {
        setMpesaPreview(null);
        return;
      }
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.vendorHint) setVendor(parsed.vendorHint);
      if (parsed.reference) setMpesaRef(parsed.reference);
      setMpesaPreview(parsed);
    });
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
      formData.set("date", date);
      if (vendor) formData.set("vendor_name", vendor);
      if (mpesaRef) formData.set("mpesa_reference_code", mpesaRef);

      const result = await createExpense(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Expense logged");
        setAmount("");
        setVendor("");
        setMpesaRef("");
        setMpesaPreview(null);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Log spend</p>
          <p className="text-xs text-muted-foreground">
            Paste M-Pesa SMS or enter manually
          </p>
        </div>
        {captureHref && (
          <Link
            href={captureHref}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Capture receipt
          </Link>
        )}
      </div>

      <div className="space-y-2">
        <Label>M-Pesa paste (optional)</Label>
        <Textarea
          placeholder="Paste M-Pesa confirmation SMS…"
          rows={2}
          className="text-sm"
          onPaste={(e) => handleMpesaPaste(e.clipboardData.getData("text"))}
          onChange={(e) => {
            if (!e.target.value.trim()) setMpesaPreview(null);
          }}
        />
        {mpesaPreview && (
          <p className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-foreground">
            Parsed: {mpesaPreview.amount ? `KES ${mpesaPreview.amount.toLocaleString()}` : "—"}
            {mpesaPreview.vendorHint ? ` · ${mpesaPreview.vendorHint}` : ""}
            {mpesaPreview.reference ? ` · Ref ${mpesaPreview.reference}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manual-amount">Amount (KES)</Label>
          <Input
            id="manual-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-date">Date</Label>
          <Input
            id="manual-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manual-vendor">Vendor (optional)</Label>
          <Input
            id="manual-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Naivas, plumber…"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v as typeof category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="button" className="w-full" onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving…" : "Save expense"}
      </Button>
    </div>
  );
}
