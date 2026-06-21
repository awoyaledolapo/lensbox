import type { Metadata } from "next";
import { AppShell } from "@/app/components/AppShell";
import { getAuthUser } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings — LensBox",
  description: "Manage your studio profile, branding, and notification preferences.",
};

export default async function SettingsPage() {
  const user = await getAuthUser();

  // Derive display name using the same priority as the dashboard greeting:
  // full_name (signup) → OAuth name → email prefix → empty string
  const rawName: string =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";

  const defaultName = rawName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const defaultEmail = user?.email ?? "";

  return (
    <AppShell eyebrow="Studio settings" title="Settings">
      <SettingsClient defaultName={defaultName} defaultEmail={defaultEmail} />
    </AppShell>
  );
}