import { notFound } from "next/navigation";
import { getUnitHubData } from "@/lib/actions/units";
import { UnitBentoHub } from "@/components/unit/unit-bento-hub";

export default async function UnitHubPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const data = await getUnitHubData(propertyId);

  if (!data) notFound();

  return (
    <UnitBentoHub
      propertyId={data.property.id}
      propertyName={data.property.name}
      lowStockCount={data.lowStockCount}
      spendMtd={data.spendMtd}
      pendingTasks={data.pendingTasks}
      etimsOptIn={data.etimsOptIn}
    />
  );
}
