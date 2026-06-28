import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";

export async function middleware(request: NextRequest) {
  if (isAuthBypassEnabled()) {
    if (
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|api/health|api/webhooks/.*|api/units/.*|setup|onboarding).*)",
  ],
};
