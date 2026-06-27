import { NextResponse } from "next/server";
import { z } from "zod";

const reservationEventSchema = z.object({
  event: z.enum(["reservation.created", "reservation.cancelled"]),
  data: z.object({
    reservation_id: z.string(),
    property_id: z.string().optional(),
    zodomus_property_id: z.string().optional(),
    guest_count: z.number().optional(),
    check_in: z.string().optional(),
    check_out: z.string().optional(),
  }),
});

function verifyWebhookAuth(request: Request): boolean {
  const secret = process.env.ZODOMUS_WEBHOOK_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const apiKey = request.headers.get("x-zodomus-signature");

  return bearerToken === secret || apiKey === secret;
}

export async function POST(request: Request) {
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reservationEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { event, data } = parsed.data;

  switch (event) {
    case "reservation.created": {
      // TODO: Link to property via zodomus_property_id, trigger inventory deduction
      console.log("[Zodomus] reservation.created", data);
      return NextResponse.json({
        received: true,
        event,
        action: "logged",
        reservation_id: data.reservation_id,
      });
    }

    case "reservation.cancelled": {
      // TODO: Reverse inventory adjustments or update calendar availability
      console.log("[Zodomus] reservation.cancelled", data);
      return NextResponse.json({
        received: true,
        event,
        action: "logged",
        reservation_id: data.reservation_id,
      });
    }

    default:
      return NextResponse.json({ error: "Unhandled event" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/zodomus",
    methods: ["POST"],
  });
}
