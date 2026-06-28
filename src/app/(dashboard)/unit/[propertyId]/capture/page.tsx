import { notFound } from "next/navigation";
import { DrillInShell } from "@/components/layout/drill-in-shell";
import { GlassSection } from "@/components/layout/page-shell";
import { ReceiptCapture } from "@/components/unit/receipt-capture";
import { getReceiptOcrQuota } from "@/lib/actions/receipt-ocr";
import { getPropertyForOwner } from "@/lib/actions/properties";

export default async function UnitCapturePage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyForOwner(propertyId);
  if (!property) notFound();

  const quota = await getReceiptOcrQuota();

  return (
    <DrillInShell
      propertyId={propertyId}
      propertyName={property.name}
      title="Capture receipt"
      subtitle="Camera-first with optional OCR pre-fill"
    >
      <GlassSection>
        <ReceiptCapture
          propertyId={propertyId}
          ocrRemaining={quota.remaining}
          ocrLimit={quota.limit}
        />
      </GlassSection>
    </DrillInShell>
  );
}
