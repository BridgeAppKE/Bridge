import { ensureDefaultProperty } from "@/lib/actions/properties";
import { getUnitSummaries } from "@/lib/actions/units";
import { UnitPortfolioList } from "@/components/unit/unit-portfolio-list";

export default async function UnitPortfolioPage() {
  await ensureDefaultProperty();
  const units = await getUnitSummaries();

  return <UnitPortfolioList units={units} />;
}
