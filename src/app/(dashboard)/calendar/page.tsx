import { getUserProperties } from "@/lib/actions/properties";
import { getAllVisibleBookings } from "@/lib/actions/bookings";
import { getEtimsOptIn } from "@/lib/actions/compliance";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { getRequestOrigin } from "@/lib/env";

export default async function CalendarPage() {
  const [units, bookings, siteOrigin, etimsOptIn] = await Promise.all([
    getUserProperties(),
    getAllVisibleBookings(),
    getRequestOrigin(),
    getEtimsOptIn(),
  ]);

  return (
    <CalendarClient
      units={units}
      bookings={bookings}
      siteOrigin={siteOrigin}
      etimsOptIn={etimsOptIn}
    />
  );
}
