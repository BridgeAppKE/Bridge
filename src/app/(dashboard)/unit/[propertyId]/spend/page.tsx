import { notFound } from "next/navigation";
import { DrillInShell } from "@/components/layout/drill-in-shell";
import { GlassSection } from "@/components/layout/page-shell";
import { SpendFeed } from "@/components/unit/spend-feed";
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
        <SpendFeed expenses={expenses} />
      </GlassSection>
    </DrillInShell>
  );
}
