import { BentoGrid } from "@/components/home/bento-grid";
import { CirclesHeroTile } from "@/components/home/tiles/circles-hero-tile";
import { FinancialTile } from "@/components/home/tiles/financial-tile";
import { InventoryAlertsTile } from "@/components/home/tiles/inventory-alerts-tile";
import { CleanerActivityTile } from "@/components/home/tiles/cleaner-activity-tile";
import type { CircleMemberDisplay } from "@/components/home/tiles/circles-hero-tile";
import type { RevenuePoint } from "@/components/home/tiles/financial-tile";
import type { InventoryAlert } from "@/components/home/tiles/inventory-alerts-tile";
import type { CleanerJob } from "@/components/home/tiles/cleaner-activity-tile";

export type HomeBentoData = {
  hostName: string;
  circleMembers: CircleMemberDisplay[];
  netRevenue: number;
  quarterRevenue: number;
  yearRevenue: number;
  revenueTrend: RevenuePoint[];
  revenueChangePercent: number;
  inventoryAlerts: InventoryAlert[];
  latestCleanerJob: CleanerJob | null;
};

export function HomeBentoDashboard({ data }: { data: HomeBentoData }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1 px-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          EliteHost
        </p>
        <h1 className="text-2xl font-semibold tracking-wide text-foreground">
          Karibu, {data.hostName}
        </h1>
      </header>

      <BentoGrid>
        <CirclesHeroTile members={data.circleMembers} />
        <FinancialTile
          netRevenue={data.netRevenue}
          quarterRevenue={data.quarterRevenue}
          yearRevenue={data.yearRevenue}
          trend={data.revenueTrend}
          changePercent={data.revenueChangePercent}
        />
        <InventoryAlertsTile items={data.inventoryAlerts} />
        <CleanerActivityTile job={data.latestCleanerJob} />
      </BentoGrid>
    </div>
  );
}
