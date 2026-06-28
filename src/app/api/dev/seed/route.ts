import { NextResponse } from "next/server";
import { isDevSeedEnabled } from "@/lib/demo/env";
import { runDevSeed, wipeDevSeed } from "@/lib/demo/seed-service";

export async function POST() {
  if (!isDevSeedEnabled()) {
    return NextResponse.json({ error: "Dev seed is disabled" }, { status: 403 });
  }

  try {
    const result = await runDevSeed();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  if (!isDevSeedEnabled()) {
    return NextResponse.json({ error: "Dev seed is disabled" }, { status: 403 });
  }

  try {
    const result = await wipeDevSeed();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wipe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
