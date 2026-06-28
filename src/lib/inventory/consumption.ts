/** Units consumed per guest per night of stay. */
export function computeStayConsumption(
  usagePerGuest: number,
  guestCount: number,
  nights: number
): number {
  const guests = Math.max(guestCount, 1);
  const stayNights = Math.max(nights, 1);
  return usagePerGuest * guests * stayNights;
}

export function bookingNights(startDate: string, endDate: string): number {
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPastDate(date: string): boolean {
  return date < todayIsoDate();
}

export function addDaysIso(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
