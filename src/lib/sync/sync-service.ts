"use client";

import { parseIcs } from "@/lib/sync/parse-ics";
import { upsertBookingsFromSync, updateUnitLastSynced } from "@/lib/actions/bookings";

export async function syncUnitFromIcal(propertyId: string, icalUrl: string) {
  try {
    const response = await fetch(icalUrl, { cache: "no-store" });
    if (!response.ok) {
      return { error: `Failed to fetch iCal (${response.status})` };
    }

    const text = await response.text();
    const events = parseIcs(text);

    if (events.length === 0) {
      const syncedAt = new Date().toISOString();
      await updateUnitLastSynced(propertyId, syncedAt);
      return { success: true, syncedAt, imported: 0 };
    }

    const result = await upsertBookingsFromSync(
      propertyId,
      events.map((e) => ({
        external_uid: e.uid,
        start_date: e.start,
        end_date: e.end,
        is_manual_block: false,
      }))
    );

    if (result.error) return { error: result.error };

    const syncedAt = new Date().toISOString();
    await updateUnitLastSynced(propertyId, syncedAt);

    return {
      success: true,
      syncedAt,
      imported: result.count ?? events.length,
    };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Sync failed. Check iCal URL and CORS availability.",
    };
  }
}
