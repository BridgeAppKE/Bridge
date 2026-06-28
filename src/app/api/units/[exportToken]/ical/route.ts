import { createServiceClient } from "@/lib/supabase/admin";
import { buildExportFeed } from "@/lib/ical/build-export-feed";

export async function GET(
  _request: Request,
  { params }: { params: { exportToken: string } }
) {
  const admin = createServiceClient();

  const { data: property, error } = await admin
    .from("properties")
    .select("id, name")
    .eq("ical_export_token", params.exportToken)
    .maybeSingle();

  if (error || !property) {
    return new Response("Not found", { status: 404 });
  }

  const { data: bookings } = await admin
    .from("bookings")
    .select("id, start_date, end_date, is_manual_block")
    .eq("property_id", property.id)
    .gte("end_date", new Date().toISOString().slice(0, 10));

  const body = buildExportFeed(property.name, bookings ?? []);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache, max-age=0",
    },
  });
}
