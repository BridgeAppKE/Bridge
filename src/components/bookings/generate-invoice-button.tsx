"use client";

import { downloadInvoice } from "@/lib/invoicing/generate-invoice-pdf";
import { createInvoiceRecord } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface GenerateInvoiceButtonProps {
  bookingId: string;
  unitName: string;
  guestCount: number;
  startDate: string;
  endDate: string;
  nightlyRate?: number;
}

export function GenerateInvoiceButton({
  bookingId,
  unitName,
  guestCount,
  startDate,
  endDate,
  nightlyRate = 8500,
}: GenerateInvoiceButtonProps) {
  async function handleGenerate() {
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const total = nights * nightlyRate * Math.max(guestCount, 1);

    downloadInvoice({
      bookingId,
      unitName,
      guestCount: guestCount || 1,
      startDate,
      endDate,
      nightlyRate,
    });

    await createInvoiceRecord(bookingId, total);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      className="tap-scale h-8 gap-1 px-2 text-xs"
    >
      <FileText className="h-3.5 w-3.5" />
      Invoice
    </Button>
  );
}
