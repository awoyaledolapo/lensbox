import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthUser } from "@/lib/supabase/server";

/**
 * Protected layout — wraps all routes inside (protected)/.
 *
 * This is the primary server-side auth gate. Even if middleware is bypassed
 * (e.g. a direct server-to-server request), this layout will always
 * enforce authentication before rendering any child page.
 *
 * Middleware provides the fast Edge-layer redirect; this layout is the
 * ground-truth fallback.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    
    redirect("/login");
  }

  return <>{children}</>;
}
