import { getInventoryItems } from "@/lib/actions/inventory-v2";
import { getCircleInvitations } from "@/lib/actions/circles";
import { getBookingsWithRevenue } from "@/lib/actions/bookings";
import { getCurrentUser } from "@/lib/actions/auth";
import { getHostProfile } from "@/lib/actions/onboarding";
import { userHasAnyIcalFeed } from "@/lib/actions/ical-feeds";
import { getLatestActiveTask } from "@/lib/actions/operations";
import { HomeBentoDashboard } from "@/components/home/home-bento-dashboard";
import type { HomeBentoData } from "@/components/home/home-bento-dashboard";
import {
  buildRevenueTrendFromBookings,
  revenueChangePercent,
  sumRevenueInRange,
} from "@/lib/revenue";

export default async function HomePage() {
  const user = await getCurrentUser();
  const profile = await getHostProfile();

  const [inventoryRules, circleMembers, bookings, hasIcal, activeTask] =
    await Promise.all([
      getInventoryItems(),
      getCircleInvitations(),
      getBookingsWithRevenue(),
      userHasAnyIcalFeed(),
      getLatestActiveTask(),
    ]);

  const firstName =
    profile?.legal_name?.split(" ")[0] ??
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
      const maxStock = Math.max(rule.quantity, rule.alert_threshold, 1);
      const percent = Math.round((rule.quantity / maxStock) * 100);
      return {
        id: rule.id,
        name: rule.name,
        stockPercent: Math.min(percent, 100),
        label: `${rule.quantity} remaining · ${rule.properties?.name ?? "Unit"}`,
      };
    })
    .sort((a, b) => a.stockPercent - b.stockPercent)
    .slice(0, 4);


  const showIcalNudge =
    !hasIcal &&
    !profile?.ical_nudge_dismissed_at &&
    profile?.onboarding_completed !== false;

  const bentoData: HomeBentoData = {
    hostName: firstName,
    shortCode: profile?.short_code ?? null,
    circleMembers: circleDisplay,
    netRevenue,
    quarterRevenue,
    yearRevenue,
    revenueTrend: buildRevenueTrendFromBookings(bookings),
    revenueChangePercent: revenueChangePercent(bookings),
    inventoryAlerts,
    latestCleanerJob: activeTask
      ? {
          id: activeTask.id,
          propertyName: activeTask.properties?.name ?? "Unit",
          completedAt: activeTask.due_at
            ? `Due ${new Date(activeTask.due_at).toLocaleString("en-KE")}`
            : activeTask.status.replace("_", " "),
          verified: activeTask.status === "completed",
        }
      : null,
    showIcalNudge,
  };

  return <HomeBentoDashboard data={bentoData} />;
}
