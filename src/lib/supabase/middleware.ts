import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();

  if (!env) {
    if (request.nextUrl.pathname.startsWith("/api/health")) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.rewrite(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname.startsWith("/setup");

    if (!user && !isAuthRoute && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute && request.nextUrl.pathname !== "/setup") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("[middleware] Supabase session error:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }

  return supabaseResponse;
}
