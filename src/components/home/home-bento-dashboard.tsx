import { CirclesHeroTile } from "@/components/home/tiles/circles-hero-tile";
import { FinancialTile } from "@/components/home/tiles/financial-tile";
import { InventoryAlertsTile } from "@/components/home/tiles/inventory-alerts-tile";
import { CleanerActivityTile } from "@/components/home/tiles/cleaner-activity-tile";
import { IcalInactiveNudge } from "@/components/home/tiles/ical-inactive-nudge";
import type { CircleMemberDisplay } from "@/components/home/tiles/circles-hero-tile";
import type { RevenuePoint } from "@/components/home/tiles/financial-tile";
import type { InventoryAlert } from "@/components/home/tiles/inventory-alerts-tile";
import type { CleanerJob } from "@/components/home/tiles/cleaner-activity-tile";
import { PanelTile } from "@/components/ui/glass-tile";
import { sectionLabelClass } from "@/lib/design/tokens";

export type HomeBentoData = {
  hostName: string;
  circleMembers: CircleMemberDisplay[];
  shortCode: string | null;
  netRevenue: number;
  quarterRevenue: number;
  yearRevenue: number;
  revenueTrend: RevenuePoint[];
  revenueChangePercent: number;
  inventoryAlerts: InventoryAlert[];
  latestCleanerJob: CleanerJob | null;
  showIcalNudge: boolean;
};

export function HomeBentoDashboard({ data }: { data: HomeBentoData }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className={sectionLabelClass}>Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Karibu, {data.hostName}
        </h1>
      </header>

      {data.showIcalNudge && <IcalInactiveNudge />}

      {/* Hero metric pair — Apple Fitness style 2-col grid */}
      <div className="grid grid-cols-2 gap-3">
        <PanelTile className="flex min-h-[168px] flex-col">
          <CirclesHeroTile
            members={data.circleMembers}
            compact
            shortCode={data.shortCode}
          />
        </PanelTile>
        <PanelTile className="min-h-[168px] p-0">
          <FinancialTile
            compact
            netRevenue={data.netRevenue}
            quarterRevenue={data.quarterRevenue}
            yearRevenue={data.yearRevenue}
            trend={data.revenueTrend}
            changePercent={data.revenueChangePercent}
          />
        </PanelTile>
      </div>

      {/* Full-width operational stack */}
      <div className="space-y-3">
        <InventoryAlertsTile items={data.inventoryAlerts} fullWidth />
        <CleanerActivityTile job={data.latestCleanerJob} fullWidth />
      </div>
    </div>
  );
}
