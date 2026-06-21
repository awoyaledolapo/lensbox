import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware runs on every matched request at the Edge.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session (keeps auth tokens alive via cookie).
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Redirect authenticated users away from auth routes (login/signup).
 *
 * The layout-level protection (layout.tsx files) is the primary source of
 * truth. Middleware adds a fast early redirect layer on top.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Build a Supabase client that can read/write the response cookies.
  // This is required to refresh the auth session token.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First write cookies into the request (so Server Components see them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response so it carries the updated cookies.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always call getUser() here — it refreshes the session token.
  // Do NOT use getSession(); it reads a potentially stale cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Redirect authenticated users away from auth pages ──────────────────────
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ── Redirect unauthenticated users away from protected pages ───────────────
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/galleries") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/pricing");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    // Preserve the intended destination so we can redirect back after login.
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // ── Pass through all other requests ────────────────────────────────────────
  // Return supabaseResponse (not NextResponse.next()) to preserve the
  // refreshed session cookies.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run middleware on all routes except:
     * - _next/static  (Next.js static files)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
