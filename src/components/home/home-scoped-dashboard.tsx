"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUnitContext } from "@/components/layout/unit-context";
import { HomeBentoDashboard, type HomeBentoData } from "@/components/home/home-bento-dashboard";

export function HomeScopedDashboard({ data }: { data: HomeBentoData & { propertyIds?: string[] } }) {
  const { isAllUnits, selectedProperty, selectedUnitId } = useUnitContext();

  const scoped = useMemo(() => {
    if (isAllUnits) return data;

    const unitName = selectedProperty?.name ?? "Unit";
    const filteredAlerts = data.inventoryAlerts.filter((a) =>
      a.label.includes(unitName)
    );

    return {
      ...data,
      inventoryAlerts: filteredAlerts.length ? filteredAlerts : data.inventoryAlerts.slice(0, 2),
    };
  }, [data, isAllUnits, selectedProperty]);

  return (
    <div>
      {!isAllUnits && selectedProperty && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing data for{" "}
          <Link href={`/unit/${selectedUnitId}`} className="font-medium text-primary">
            {selectedProperty.name}
          </Link>
        </p>
      )}
      <HomeBentoDashboard data={scoped} />
    </div>
  );
}
