const NIGHTLY_RATE_KES = 8500;

type BookingLike = {
  start_date: string;
  end_date: string;
  guest_count: number | null;
  is_manual_block: boolean;
};

export function bookingRevenue(booking: BookingLike): number {
  if (booking.is_manual_block) return 0;
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  return nights * NIGHTLY_RATE_KES * Math.max(booking.guest_count ?? 2, 1);
}

export function sumRevenueInRange(
  bookings: BookingLike[],
  start: Date,
  end: Date
): number {
  return bookings
    .filter((b) => {
      const d = new Date(b.start_date);
      return d >= start && d <= end && !b.is_manual_block;
    })
    .reduce((sum, b) => sum + bookingRevenue(b), 0);
}

export function buildRevenueTrendFromBookings(bookings: BookingLike[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (5 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      label: weekStart.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      value: sumRevenueInRange(bookings, weekStart, weekEnd),
    };
  });
}

export function revenueChangePercent(bookings: BookingLike[]): number {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonth = sumRevenueInRange(bookings, thisMonthStart, now);
  const lastMonth = sumRevenueInRange(bookings, lastMonthStart, lastMonthEnd);

  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}
