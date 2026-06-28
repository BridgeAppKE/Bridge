import { NextResponse } from "next/server";
import { isDevSimulateEnabled } from "@/lib/demo/env";
import { simulateDevHourly } from "@/lib/demo/simulate-hourly";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDevSimulateEnabled()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "dev simulate disabled" });
  }

  try {
    const result = await simulateDevHourly();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
