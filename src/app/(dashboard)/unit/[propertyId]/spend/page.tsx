import { notFound } from "next/navigation";
import { DrillInShell } from "@/components/layout/drill-in-shell";
import { GlassSection } from "@/components/layout/page-shell";
import { SpendFeed } from "@/components/unit/spend-feed";
import { ManualExpenseForm } from "@/components/expenses/manual-expense-form";
import { getExpenses } from "@/lib/actions/expenses-v2";
import { getPropertyForOwner } from "@/lib/actions/properties";

export default async function UnitSpendPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyForOwner(propertyId);
  if (!property) notFound();

  const expenses = await getExpenses(propertyId);

  return (
    <DrillInShell
      propertyId={propertyId}
      propertyName={property.name}
      title="Spend"
      subtitle="Expense feed for this unit"
    >
      <GlassSection>
        <div className="space-y-6">
          <ManualExpenseForm
            propertyId={propertyId}
            captureHref={`/unit/${propertyId}/capture`}
          />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent
            </p>
            <SpendFeed expenses={expenses} />
          </div>
        </div>
      </GlassSection>
    </DrillInShell>
  );
}
