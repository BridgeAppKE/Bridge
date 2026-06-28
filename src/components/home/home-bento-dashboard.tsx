import Link from "next/link";
import { CirclesHeroTile } from "@/components/home/tiles/circles-hero-tile";
import { FinancialTile } from "@/components/home/tiles/financial-tile";
import { InventoryAlertsTile } from "@/components/home/tiles/inventory-alerts-tile";
import { IcalInactiveNudge } from "@/components/home/tiles/ical-inactive-nudge";
import { CleanerActivityTile } from "@/components/home/tiles/cleaner-activity-tile";
import { HomeQuickActions } from "@/components/home/home-quick-actions";
import type { CircleMemberDisplay } from "@/components/home/tiles/circles-hero-tile";
import type { RevenuePoint, BookingExportRow } from "@/components/home/tiles/financial-tile";
import type { InventoryAlert } from "@/components/home/tiles/inventory-alerts-tile";
import type { CleanerJob } from "@/components/home/tiles/cleaner-activity-tile";
import { PanelTile } from "@/components/ui/glass-tile";
import { Badge } from "@/components/ui/badge";
import { sectionLabelClass, listRowClass } from "@/lib/design/tokens";

export type UpcomingStay = {
  id: string;
  unitName: string;
  startDate: string;
  endDate: string;
  isBlock: boolean;
};

export type HomeBentoData = {
  hostName: string;
  circleMembers: CircleMemberDisplay[];
  shortCode: string | null;
  netRevenue: number;
  quarterRevenue: number;
  yearRevenue: number;
  revenueTrend: RevenuePoint[];
  revenueChangePercent: number;
  exportRowsByPeriod?: Record<"month" | "quarter" | "year", BookingExportRow[]>;
  spendMtd: number;
  inventoryAlerts: InventoryAlert[];
  upcomingStays: UpcomingStay[];
  pendingOpsJob: CleanerJob | null;
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

      <PanelTile className="p-4">
        <CirclesHeroTile members={data.circleMembers} shortCode={data.shortCode} />
      </PanelTile>

      <PanelTile className="min-h-[180px] p-0">
        <FinancialTile
          netRevenue={data.netRevenue}
          quarterRevenue={data.quarterRevenue}
          yearRevenue={data.yearRevenue}
          trend={data.revenueTrend}
          changePercent={data.revenueChangePercent}
          exportRowsByPeriod={data.exportRowsByPeriod}
        />
      </PanelTile>

      <PanelTile className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Spend this month
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            KES {data.spendMtd.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Net est. KES {(data.netRevenue - data.spendMtd).toLocaleString()}
          </p>
        </div>
        <Link
          href="/unit/capture"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Log spend
        </Link>
      </PanelTile>

      <HomeQuickActions />

      {data.pendingOpsJob && (
        <CleanerActivityTile job={data.pendingOpsJob} fullWidth />
      )}

      <InventoryAlertsTile items={data.inventoryAlerts} fullWidth />

      <PanelTile>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Upcoming stays
        </p>
        {data.upcomingStays.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bookings in the next few weeks.</p>
        ) : (
          <ul className="space-y-2">
            {data.upcomingStays.map((stay) => (
              <li key={stay.id} className={listRowClass}>
                <div className="flex flex-1 items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{stay.unitName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(stay.startDate).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {new Date(stay.endDate).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={stay.isBlock ? "secondary" : "default"}>
                    {stay.isBlock ? "Blocked" : "Booking"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/calendar"
          className="mt-3 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View calendar
        </Link>
      </PanelTile>
    </div>
  );
}
