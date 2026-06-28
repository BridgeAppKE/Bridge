import { notFound } from "next/navigation";
import { getUnitHubData, getUnitSummaries } from "@/lib/actions/units";
import { UnitBentoHub } from "@/components/unit/unit-bento-hub";

export default async function UnitHubPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const [data, summaries] = await Promise.all([
    getUnitHubData(propertyId),
    getUnitSummaries(),
  ]);

  if (!data) notFound();

  return (
    <UnitBentoHub
      propertyId={data.property.id}
      propertyName={data.property.name}
      baseRateKes={Number((data.property as { base_rate_kes?: number }).base_rate_kes ?? 8500)}
      unitCount={summaries.length}
      lowStockCount={data.lowStockCount}
      spendMtd={data.spendMtd}
      pendingTasks={data.pendingTasks}
      etimsOptIn={data.etimsOptIn}
    />
  );
}
