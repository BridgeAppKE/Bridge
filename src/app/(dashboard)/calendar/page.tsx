import { ensureDefaultProperty, getUserProperties } from "@/lib/actions/properties";
import { getAllVisibleBookings } from "@/lib/actions/bookings";
import { CalendarClient } from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
  await ensureDefaultProperty();
  const [units, bookings] = await Promise.all([
    getUserProperties(),
    getAllVisibleBookings(),
  ]);

  return <CalendarClient units={units} bookings={bookings} />;
}
