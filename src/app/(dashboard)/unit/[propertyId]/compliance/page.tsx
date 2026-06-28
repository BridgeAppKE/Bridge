import { notFound } from "next/navigation";
import { DrillInShell } from "@/components/layout/drill-in-shell";
import { GlassSection } from "@/components/layout/page-shell";
import { ComplianceClient } from "@/components/compliance/compliance-client";
import {
  getDraftReviewInvoices,
  getEtimsOptIn,
  getPlSummary,
} from "@/lib/actions/compliance";
import { getPropertyForOwner } from "@/lib/actions/properties";

export default async function UnitCompliancePage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyForOwner(propertyId);
  if (!property) notFound();

  const [optIn, draftInvoices, plRows] = await Promise.all([
    getEtimsOptIn(),
    getDraftReviewInvoices(propertyId),
    getPlSummary(propertyId),
  ]);

  return (
    <DrillInShell
      propertyId={propertyId}
      propertyName={property.name}
      title="Compliance"
      subtitle="eTIMS opt-in and invoice review"
    >
      <GlassSection>
        <ComplianceClient
          initialOptIn={optIn}
          draftInvoices={draftInvoices}
          plRows={plRows}
          propertyId={propertyId}
        />
      </GlassSection>
    </DrillInShell>
  );
}
