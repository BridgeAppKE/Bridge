import { PageShell, GlassSection } from "@/components/layout/page-shell";
import {
  getDraftReviewInvoices,
  getEtimsOptIn,
  getPlSummary,
} from "@/lib/actions/compliance";
import { ComplianceClient } from "@/components/compliance/compliance-client";

export default async function CompliancePage() {
  const [optIn, draftInvoices, plRows] = await Promise.all([
    getEtimsOptIn(),
    getDraftReviewInvoices(),
    getPlSummary(),
  ]);

  return (
    <PageShell
      title="Compliance & P&L"
      subtitle="Private-first invoicing with optional eTIMS filing"
    >
      <GlassSection>
        <ComplianceClient
          initialOptIn={optIn}
          draftInvoices={draftInvoices}
          plRows={plRows}
        />
      </GlassSection>
    </PageShell>
  );
}
