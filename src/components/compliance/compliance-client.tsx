"use client";

import { useTransition } from "react";
import {
  fileInvoiceToEtims,
  getInvoiceShareUrl,
  setEtimsOptIn,
} from "@/lib/actions/compliance";
import type { InvoiceReviewRow, PlRow } from "@/lib/actions/compliance";
import { SectionHeader } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ComplianceClientProps {
  initialOptIn: boolean;
  draftInvoices: InvoiceReviewRow[];
  plRows: PlRow[];
  propertyId?: string;
}

export function ComplianceClient({
  initialOptIn,
  draftInvoices,
  plRows,
}: ComplianceClientProps) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptIn(initialOptIn);
  }, [initialOptIn]);

  function handleOptIn(checked: boolean) {
    setOptIn(checked);
    startTransition(async () => {
      const result = await setEtimsOptIn(checked);
      if (result.error) toast.error(result.error);
    });
  }

  function handleFile(invoiceId: string) {
    startTransition(async () => {
      const result = await fileInvoiceToEtims(invoiceId);
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? "Filed to eTIMS");
    });
  }

  function handleShare(invoiceId: string) {
    startTransition(async () => {
      const result = await getInvoiceShareUrl(invoiceId);
      if (result.error) toast.error(result.error);
      else if (result.url) {
        await navigator.clipboard.writeText(result.url);
        toast.success("Share link copied — send to your guest");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="etims-opt-in" className="text-base font-medium">
              eTIMS opt-in
            </Label>
            <p className="text-sm text-muted-foreground">
              Off by default. When enabled, invoices go through DigiTax review before PDF with KRA QR.
            </p>
          </div>
          <Button
            type="button"
            variant={optIn ? "default" : "outline"}
            onClick={() => handleOptIn(!optIn)}
            disabled={isPending}
          >
            {optIn ? "Enabled" : "Disabled"}
          </Button>
        </div>
      </div>

      <div>
        <SectionHeader
          title="Tax Review Room"
          description="Invoices awaiting review before eTIMS filing via DigiTax"
        />
        {draftInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices in draft review.</p>
        ) : (
          <div className="space-y-3">
            {draftInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {new Intl.NumberFormat("en-KE", {
                      style: "currency",
                      currency: "KES",
                    }).format(inv.total_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.property_name ?? "Unit"} · {inv.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!optIn || isPending}
                    onClick={() => handleFile(inv.id)}
                  >
                    File to eTIMS
                  </Button>
                  {inv.pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleShare(inv.id)}
                    >
                      Share with guest
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader title="P&L summary" description="Revenue minus expenses by month" />
        {plRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            P&L appears after bookings and expenses are recorded.
          </p>
        ) : (
          <div className="space-y-2">
            {plRows.map((row, i) => (
              <div
                key={`${row.property_name}-${row.period_month}-${i}`}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{row.property_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(row.period_month).toLocaleDateString("en-KE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("en-KE", {
                      style: "currency",
                      currency: "KES",
                      maximumFractionDigits: 0,
                    }).format(row.net)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rev {row.booking_revenue.toFixed(0)} · Exp {row.expense_total.toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
