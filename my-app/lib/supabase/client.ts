import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * IMPORTANT: Use createBrowserClient from @supabase/ssr — NOT createClient
 * from @supabase/supabase-js. The basic client stores the session in
 * localStorage, which the server and middleware cannot read. createBrowserClient
 * stores the session in cookies so the middleware and Server Components can
 * validate the session on every request.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);