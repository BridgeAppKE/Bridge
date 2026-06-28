import { NextResponse } from "next/server";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    supabase: isSupabaseConfigured(),
    siteUrl: getSiteUrl(),
    timestamp: new Date().toISOString(),
  });
}
