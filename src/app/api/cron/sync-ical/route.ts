import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Background iCal sync endpoint (Phase 6).
 * Call via cron with Authorization: Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase service credentials not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceKey);
  const { data: feeds, error } = await supabase
    .from("ical_feeds")
    .select("id, property_id, url, platform_name")
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const syncedAt = new Date().toISOString();
  let updated = 0;

  for (const feed of feeds ?? []) {
    try {
      const res = await fetch(feed.url, { next: { revalidate: 0 } });
      if (!res.ok) continue;

      await supabase
        .from("ical_feeds")
        .update({ last_synced_at: syncedAt })
        .eq("id", feed.id);

      await supabase
        .from("properties")
        .update({ last_synced_at: syncedAt })
        .eq("id", feed.property_id);

      updated++;
    } catch {
      // skip failed feeds
    }
  }

  return NextResponse.json({
    ok: true,
    feedsChecked: feeds?.length ?? 0,
    feedsUpdated: updated,
    syncedAt,
  });
}
