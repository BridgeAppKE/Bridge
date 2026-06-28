import { getUserProperties } from "@/lib/actions/properties";
import { getAllVisibleBookings } from "@/lib/actions/bookings";
import { getEtimsOptIn } from "@/lib/actions/compliance";
import { getHostProfile } from "@/lib/actions/onboarding";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { getRequestOrigin } from "@/lib/env";

export default async function CalendarPage() {
  const [units, bookings, siteOrigin, etimsOptIn, profile] = await Promise.all([
    getUserProperties(),
    getAllVisibleBookings(),
    getRequestOrigin(),
    getEtimsOptIn(),
    getHostProfile(),
  ]);

  return (
    <CalendarClient
      units={units}
      bookings={bookings}
      siteOrigin={siteOrigin}
      etimsOptIn={etimsOptIn}
      kraPin={profile?.kra_pin ?? null}
    />
  );
}
