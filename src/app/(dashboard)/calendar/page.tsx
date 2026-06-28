import { getUserProperties } from "@/lib/actions/properties";
import { getAllVisibleBookings } from "@/lib/actions/bookings";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { getRequestOrigin } from "@/lib/env";

export default async function CalendarPage() {
  const [units, bookings, siteOrigin] = await Promise.all([
    getUserProperties(),
    getAllVisibleBookings(),
    getRequestOrigin(),
  ]);

  return <CalendarClient units={units} bookings={bookings} siteOrigin={siteOrigin} />;
}
