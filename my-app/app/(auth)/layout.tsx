import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthUser } from "@/lib/supabase/server";

/**
 * Auth layout — wraps /login and /signup.
 *
 * If the user is already authenticated, send them straight to /dashboard
 * rather than showing the login/signup form again.
 */
export default async function AuthGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthUser();

  if (user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
