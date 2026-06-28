import { getInventoryRules } from "@/lib/actions/inventory";
import { getCircleMembers } from "@/lib/actions/circles";
import { getBookingsWithRevenue } from "@/lib/actions/bookings";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { getCurrentUser } from "@/lib/actions/auth";
import { HomeBentoDashboard } from "@/components/home/home-bento-dashboard";
import type { HomeBentoData } from "@/components/home/home-bento-dashboard";
import {
  buildRevenueTrendFromBookings,
  revenueChangePercent,
  sumRevenueInRange,
} from "@/lib/revenue";

export default async function HomePage() {
  await ensureDefaultProperty();

  const user = await getCurrentUser();
  const [properties, inventoryRules, circleMembers, bookings] = await Promise.all([
    getUserProperties(),
    getInventoryRules(),
    getCircleMembers(),
    getBookingsWithRevenue(),
  ]);

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Host";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const netRevenue = sumRevenueInRange(bookings, monthStart, now);
  const quarterRevenue = sumRevenueInRange(bookings, quarterStart, now);
  const yearRevenue = sumRevenueInRange(bookings, yearStart, now);

  const acceptedMembers = circleMembers.filter((m) => m.status === "accepted");

  const circleDisplay = acceptedMembers.slice(0, 3).map((member, index) => ({
    id: member.id,
    name: member.peer.full_name ?? "Circle Host",
    status: `${2 + index} Units Available`,
    unitsAvailable: 2 + index,
  }));

  const inventoryAlerts = inventoryRules
    .map((rule) => {
      const maxStock = Math.max(rule.current_stock, rule.alert_threshold, 1);
      const percent = Math.round((rule.current_stock / maxStock) * 100);
      return {
        id: rule.id,
        name: rule.item_name,
        stockPercent: Math.min(percent, 100),
        label: `${rule.current_stock} remaining · ${rule.properties?.name ?? "Unit"}`,
      };
    })
    .sort((a, b) => a.stockPercent - b.stockPercent)
    .slice(0, 4);

  const primaryProperty = properties[0];

  const bentoData: HomeBentoData = {
    hostName: firstName,
    circleMembers: circleDisplay,
    netRevenue,
    quarterRevenue,
    yearRevenue,
    revenueTrend: buildRevenueTrendFromBookings(bookings),
    revenueChangePercent: revenueChangePercent(bookings),
    inventoryAlerts,
    latestCleanerJob: primaryProperty
      ? {
          id: "mock-1",
          propertyName: primaryProperty.name,
          completedAt: "Today · 11:42 AM · Turnover complete",
          verified: true,
        }
      : null,
  };

  return <HomeBentoDashboard data={bentoData} />;
}
