import { notFound } from "next/navigation";
import { DrillInShell } from "@/components/layout/drill-in-shell";
import { GlassSection } from "@/components/layout/page-shell";
import { InventoryChecklist } from "@/components/unit/inventory-checklist";
import { getInventoryItems } from "@/lib/actions/inventory-v2";
import { getPropertyForOwner } from "@/lib/actions/properties";

export default async function UnitStockPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyForOwner(propertyId);
  if (!property) notFound();

  const items = await getInventoryItems(propertyId);

  return (
    <DrillInShell
      propertyId={propertyId}
      propertyName={property.name}
      title="Stock"
      subtitle="Airbnb checklist and replenishment"
    >
      <GlassSection>
        <InventoryChecklist propertyId={propertyId} existingItems={items} />
      </GlassSection>
    </DrillInShell>
  );
}
