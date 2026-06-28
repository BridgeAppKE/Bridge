"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Camera, Upload } from "lucide-react";
import {
  createSplitExpenses,
  parseMpesaStatement,
  uploadReceipt,
} from "@/lib/actions/expenses-v2";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/constants";
import type { MpesaParseResult } from "@/lib/parsers/expense-parsers";
import { consumeReceiptOcrCredit } from "@/lib/actions/receipt-ocr";
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

type UnitOption = { id: string; name: string };

interface PortfolioCaptureProps {
  units: UnitOption[];
  ocrRemaining: number;
  ocrLimit: number;
}

export function PortfolioCapture({ units, ocrRemaining, ocrLimit }: PortfolioCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [total, setTotal] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<Record<string, string>>(() =>
    Object.fromEntries(units.map((u) => [u.id, ""]))
  );
  const [remaining, setRemaining] = useState(ocrRemaining);
  const [mpesaPreview, setMpesaPreview] = useState<MpesaParseResult | null>(null);
  const [ocrNote, setOcrNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allocatedSum = useMemo(
    () =>
      Object.values(allocations).reduce((sum, value) => {
        const n = parseFloat(value);
        return sum + (isNaN(n) ? 0 : n);
      }, 0),
    [allocations]
  );

  const totalNum = parseFloat(total) || 0;
  const splitOk = totalNum > 0 && Math.abs(allocatedSum - totalNum) < 0.01;

  async function processFile(file: File) {
    setOcrNote(null);
    const formData = new FormData();
    formData.set("file", file);
    const upload = await uploadReceipt(formData);
    if (upload.error) {
      toast.error(upload.error);
      return;
    }
    setReceiptPath(upload.path ?? null);

    if (!upload.ocrAvailable) {
      setOcrNote("OCR unavailable — enter amount manually");
      return;
    }

    if (remaining > 0) {
      const credit = await consumeReceiptOcrCredit();
      if (credit.ok) {
        setRemaining(credit.remaining);
        if (upload.parsed?.amount) setTotal(String(upload.parsed.amount));
        if (upload.parsed?.vendor_name) setVendor(upload.parsed.vendor_name);
      }
    } else {
      setOcrNote("Upgrade for more scans — enter amount manually");
    }
  }

  function handleMpesaPaste(text: string) {
    if (!text.trim()) return;
    startTransition(async () => {
      const parsed = await parseMpesaStatement(text);
      if (!parsed.amount && !parsed.reference) {
        setMpesaPreview(null);
        return;
      }
      if (parsed.amount) setTotal(String(parsed.amount));
      if (parsed.vendorHint) setVendor(parsed.vendorHint);
      setMpesaPreview(parsed);
    });
  }

  function distributeEvenly() {
    if (!totalNum || !units.length) return;
    const perUnit = Math.floor((totalNum / units.length) * 100) / 100;
    const remainder = Math.round((totalNum - perUnit * units.length) * 100) / 100;
    const next: Record<string, string> = {};
    units.forEach((unit, index) => {
      const extra = index === 0 ? remainder : 0;
      next[unit.id] = String(perUnit + extra);
    });
    setAllocations(next);
  }

  function handleSave() {
    if (!splitOk) {
      toast.error("Unit amounts must sum to the receipt total");
      return;
    }

    startTransition(async () => {
      const result = await createSplitExpenses({
        totalAmount: totalNum,
        lines: units
          .map((unit) => ({
            propertyId: unit.id,
            amountKes: parseFloat(allocations[unit.id] || "0"),
          }))
          .filter((line) => line.amountKes > 0),
        category,
        date: new Date().toISOString().slice(0, 10),
        vendorName: vendor || null,
        receiptUrl: receiptPath,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      const count = "count" in result ? result.count : 0;
      toast.success(`Saved ${count} expense${count === 1 ? "" : "s"}`);
      setTotal("");
      setVendor("");
      setReceiptPath(null);
      setAllocations(Object.fromEntries(units.map((u) => [u.id, ""])));
    });
  }

  if (units.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Add at least two units to split a bulk shopping receipt. Use a unit&apos;s Capture page for
        single-unit receipts.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        One receipt, split manually across units.{" "}
        {remaining > 0
          ? `${remaining} of ${ocrLimit} OCR scans left this month.`
          : "Enter amounts manually — OCR limit reached."}
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

      <div className="space-y-2">
        <Label>M-Pesa paste (optional)</Label>
        <Textarea
          placeholder="Paste M-Pesa confirmation SMS…"
          rows={2}
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
        {ocrNote && <p className="text-xs text-muted-foreground">{ocrNote}</p>}
      </div>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="portfolio-total">Receipt total (KES)</Label>
            <Input
              id="portfolio-total"
              type="number"
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="8500"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolio-vendor">Vendor (optional)</Label>
          <Input
            id="portfolio-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Carrefour, Naivas…"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Split by unit</p>
          <Button type="button" variant="outline" size="sm" onClick={distributeEvenly}>
            Split evenly
          </Button>
        </div>

        <ul className="space-y-2">
          {units.map((unit) => (
            <li key={unit.id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium" title={unit.name}>
                {unit.name}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                className="w-28"
                placeholder="0"
                value={allocations[unit.id] ?? ""}
                onChange={(e) =>
                  setAllocations((prev) => ({ ...prev, [unit.id]: e.target.value }))
                }
              />
            </li>
          ))}
        </ul>

        <p
          className={`text-xs ${splitOk ? "text-muted-foreground" : "text-destructive"}`}
        >
          Allocated KES {allocatedSum.toLocaleString()} / {totalNum.toLocaleString()}
        </p>

        <Button
          type="button"
          className="w-full"
          onClick={handleSave}
          disabled={isPending || !splitOk}
        >
          {isPending ? "Saving…" : "Save split expenses"}
        </Button>
      </div>
    </div>
  );
}
