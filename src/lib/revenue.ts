const DEFAULT_NIGHTLY_RATE_KES = 8500;

type BookingLike = {
  start_date: string;
  end_date: string;
  guest_count: number | null;
  is_manual_block: boolean;
  properties?:
    | { base_rate_kes?: number | null }
    | { base_rate_kes?: number | null }[]
    | null;
};

function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function nightlyRate(booking: BookingLike): number {
  const props = Array.isArray(booking.properties)
    ? booking.properties[0]
    : booking.properties;
  return Number(props?.base_rate_kes ?? DEFAULT_NIGHTLY_RATE_KES);
}

export function bookingRevenue(booking: BookingLike): number {
  if (booking.is_manual_block) return 0;
  const nights = Math.max(
    1,
    Math.ceil(
      (parseDay(booking.end_date).getTime() - parseDay(booking.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  return nights * nightlyRate(booking);
}

/** Revenue recognized when checkout falls within [start, end] (inclusive). */
export function sumRevenueInRange(
  bookings: BookingLike[],
  start: Date,
  end: Date
): number {
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);

  return bookings
    .filter((b) => {
      if (b.is_manual_block) return false;
      const checkout = parseDay(b.end_date);
      return checkout >= rangeStart && checkout <= rangeEnd;
    })
    .reduce((sum, b) => sum + bookingRevenue(b), 0);
}

export function buildRevenueTrendFromBookings(bookings: BookingLike[]) {
  const now = new Date();
  const today = startOfDay(now);

  return Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (5 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const capEnd = weekEnd > today ? today : weekEnd;

    return {
      label: weekStart.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      value: sumRevenueInRange(bookings, weekStart, capEnd),
    };
  });
}

export type BookingExportRow = {
  Date: string;
  "Guest Name": string;
  Unit: string;
  Nights: number;
  Amount: number;
  "Payment Method": string;
};

type BookingForExport = BookingLike & {
  guest_name?: string | null;
  payment_method?: string | null;
  amount_kes?: number | null;
};

export function buildBookingExportRows(
  bookings: BookingForExport[],
  start: Date,
  end: Date
): BookingExportRow[] {
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);

  return bookings
    .filter((b) => {
      if (b.is_manual_block) return false;
      const checkout = parseDay(b.end_date);
      return checkout >= rangeStart && checkout <= rangeEnd;
    })
    .map((b) => {
      const props = Array.isArray(b.properties) ? b.properties[0] : b.properties;
      const nights = Math.max(
        1,
        Math.ceil(
          (parseDay(b.end_date).getTime() - parseDay(b.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      return {
        Date: b.start_date,
        "Guest Name": b.guest_name ?? "—",
        Unit: (props as { name?: string } | null)?.name ?? "Unit",
        Nights: nights,
        Amount: b.amount_kes ?? bookingRevenue(b),
        "Payment Method": b.payment_method ?? "—",
      };
    });
}

export function revenueChangePercent(bookings: BookingLike[]): number {
  const now = new Date();
  const today = startOfDay(now);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonth = sumRevenueInRange(bookings, thisMonthStart, today);
  const lastMonth = sumRevenueInRange(bookings, lastMonthStart, lastMonthEnd);

  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}
