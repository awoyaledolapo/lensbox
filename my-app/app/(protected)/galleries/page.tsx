import type { Metadata } from "next";
import { AppShell, PrimaryButton } from "@/app/components/AppShell";
import { getUserGalleries } from "@/lib/services/gallery.service";
import { GalleriesClient } from "./GalleriesClient";

export const metadata: Metadata = {
  title: "Galleries — LensBox",
  description: "All your client galleries in one place.",
};

export default async function GalleriesPage() {
  const galleries = await getUserGalleries();

  return (
    <AppShell
      eyebrow={`${galleries.length} ${galleries.length === 1 ? "gallery" : "galleries"}`}
      title="Galleries"
      actions={<PrimaryButton href="/galleries/new">New gallery</PrimaryButton>}
    >
      <GalleriesClient galleries={galleries} />
    </AppShell>
  );
}