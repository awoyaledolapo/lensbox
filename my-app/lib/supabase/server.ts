import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads and writes cookies via next/headers so session
 * tokens are properly persisted across requests in the App Router.
 *
 * Usage (Server Component or layout):
 *   const supabase = await createSupabaseServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can be called from a Server Component where cookie
            // mutation is not allowed. The middleware handles refreshing
            // the session in that case — this catch is intentional.
          }
        },
      },
    }
  );
}

/**
 * Returns the current authenticated user or null.
 * Always use getUser() (not getSession()) for security — getUser()
 * validates the JWT against the Supabase Auth server every call.
 */
export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
