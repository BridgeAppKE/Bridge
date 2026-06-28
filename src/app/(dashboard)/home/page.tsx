import { getExpenses } from "@/lib/actions/expenses-v2";
import { getInventoryItems } from "@/lib/actions/inventory-v2";
import { searchPeerAvailability, getMyCircles } from "@/lib/actions/circles";
import { groupPeerAvailabilityForHome } from "@/lib/circles/peer-availability";
import { getAllVisibleBookings, getBookingsWithRevenue } from "@/lib/actions/bookings";
import { getCurrentUser } from "@/lib/actions/auth";
import { getHostProfile } from "@/lib/actions/onboarding";
import { userHasAnyIcalFeed } from "@/lib/actions/ical-feeds";
import { getLatestActiveTask } from "@/lib/actions/operations";
import { HomeScopedDashboard } from "@/components/home/home-scoped-dashboard";
import type { HomeBentoData } from "@/components/home/home-bento-dashboard";
import {
  buildRevenueTrendFromBookings,
  revenueChangePercent,
  sumRevenueInRange,
  buildBookingExportRows,
} from "@/lib/revenue";

export default async function HomePage() {
  const user = await getCurrentUser();
  const profile = await getHostProfile();
  const now = new Date();

  const checkIn = now.toISOString().slice(0, 10);
  const weekOut = new Date(now);
  weekOut.setDate(weekOut.getDate() + 7);
  const checkOut = weekOut.toISOString().slice(0, 10);

  const [inventoryRules, peerSearch, bookings, allBookings, hasIcal, activeTask, expenses, circles] =
    await Promise.all([
      getInventoryItems(),
      searchPeerAvailability(checkIn, checkOut),
      getBookingsWithRevenue(),
      getAllVisibleBookings(),
      userHasAnyIcalFeed(),
      getLatestActiveTask(),
      getExpenses(),
      getMyCircles(),
    ]);

  const firstName =
    profile?.legal_name?.split(" ")[0] ??
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Host";

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const netRevenue = sumRevenueInRange(bookings, monthStart, now);
  const quarterRevenue = sumRevenueInRange(bookings, quarterStart, now);
  const yearRevenue = sumRevenueInRange(bookings, yearStart, now);

  const spendMtd = expenses
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + Number(e.amount_kes), 0);

  const circleDisplay = groupPeerAvailabilityForHome(peerSearch);

  const inventoryAlerts = inventoryRules
    .filter((rule) => rule.quantity <= rule.alert_threshold)
    .map((rule) => {
      const maxStock = Math.max(rule.quantity, rule.alert_threshold, 1);
      const percent = Math.round((rule.quantity / maxStock) * 100);
      return {
        id: rule.id,
        name: rule.name,
        unitName: rule.properties?.name ?? "Unit",
        stockPercent: Math.min(percent, 100),
        label: `${rule.quantity} left`,
      };
    })
    .sort((a, b) => a.stockPercent - b.stockPercent)
    .slice(0, 4);

  const today = now.toISOString().slice(0, 10);
  const upcomingStays = allBookings
    .filter((b) => b.end_date >= today && !b.is_manual_block)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 3)
    .map((b) => ({
      id: b.id,
      unitName: b.properties?.name ?? "Unit",
      startDate: b.start_date,
      endDate: b.end_date,
      isBlock: b.is_manual_block,
    }));

  const pendingOpsJob = activeTask
    ? {
        id: activeTask.id,
        propertyName: activeTask.properties?.name ?? "Unit",
        completedAt: activeTask.due_at
          ? `Due ${new Date(activeTask.due_at).toLocaleString("en-KE")}`
          : activeTask.status.replace("_", " "),
        verified: activeTask.status === "completed",
      }
    : null;


  const showIcalNudge =
    !hasIcal &&
    !profile?.ical_nudge_dismissed_at &&
    profile?.onboarding_completed !== false;

  const hasCircleMembers = circles.some((c) => c.member_count > 1);
  const accountAgeDays = profile?.created_at
    ? (now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const showCircleNudge =
    !hasCircleMembers &&
    accountAgeDays >= 7 &&
    !profile?.circle_nudge_dismissed_at &&
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
    exportRowsByPeriod: {
      month: buildBookingExportRows(bookings, monthStart, now),
      quarter: buildBookingExportRows(bookings, quarterStart, now),
      year: buildBookingExportRows(bookings, yearStart, now),
    },
    spendMtd,
    inventoryAlerts,
    upcomingStays,
    pendingOpsJob,
    showIcalNudge,
    showCircleNudge,
  };

  return <HomeScopedDashboard data={bentoData} />;
}
