import { notFound } from "next/navigation";
import { DrillInShell } from "@/components/layout/drill-in-shell";
import { GlassSection } from "@/components/layout/page-shell";
import { OperationsClient } from "@/components/operations/operations-client";
import { getOperationalTasks } from "@/lib/actions/operations";
import { getPropertyForOwner } from "@/lib/actions/properties";

export default async function UnitOperationsPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyForOwner(propertyId);
  if (!property) notFound();

  const tasks = await getOperationalTasks(propertyId);

  return (
    <DrillInShell
      propertyId={propertyId}
      propertyName={property.name}
      title="Operations"
      subtitle="Staff tasks and turnover"
    >
      <GlassSection>
        <OperationsClient properties={[property]} tasks={tasks} defaultPropertyId={propertyId} />
      </GlassSection>
    </DrillInShell>
  );
}
