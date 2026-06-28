"use client";

import { useTransition } from "react";
import { downloadInvoice } from "@/lib/invoicing/generate-invoice-pdf";
import { createInvoiceRecord } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface GenerateInvoiceButtonProps {
  bookingId: string;
  unitName: string;
  guestCount: number;
  startDate: string;
  endDate: string;
  nightlyRate?: number;
  propertyId?: string;
  etimsOptIn?: boolean;
}

export function GenerateInvoiceButton({
  bookingId,
  unitName,
  guestCount,
  startDate,
  endDate,
  nightlyRate = 8500,
  propertyId,
  etimsOptIn = false,
}: GenerateInvoiceButtonProps) {
  const [isPending, startTransition] = useTransition();

  async function handleGenerate() {
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const total = nights * nightlyRate * Math.max(guestCount, 1);

    startTransition(async () => {
      if (!etimsOptIn) {
        downloadInvoice({
          bookingId,
          unitName,
          guestCount: guestCount || 1,
          startDate,
          endDate,
          nightlyRate,
        });
      }

      const result = await createInvoiceRecord(bookingId, total, undefined, propertyId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.draftReview) {
        toast.success("Invoice queued for eTIMS review in Unit → Compliance");
      } else if (etimsOptIn) {
        toast.success("Draft invoice created");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      disabled={isPending}
      className="tap-scale h-8 gap-1 px-2 text-xs"
    >
      <FileText className="h-3.5 w-3.5" />
      {etimsOptIn ? "Invoice" : "PDF"}
    </Button>
  );
}
