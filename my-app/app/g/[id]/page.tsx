import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientGalleryView } from "./ClientGalleryView";

// ─── Types ────────────────────────────────────────────────────────────────────

type PublicGallery = {
  id: string;
  title: string;
  client_name: string | null;
  cover_image_url: string | null;
};

type PublicPhoto = {
  id: string;
  image_url: string;
  file_name: string;
};

// ─── Data fetching ────────────────────────────────────────────────────────────

/**
 * Fetch gallery data using the anon client (no auth cookies).
 * Supabase RLS will only return the gallery if is_public = true.
 * If the gallery doesn't exist or is not public, returns null.
 */
async function getPublicGallery(
  id: string
): Promise<{ gallery: PublicGallery; photos: PublicPhoto[] } | null> {
  // Use the server client — it still uses the anon key when no session cookie
  // is present, so RLS applies correctly for unauthenticated visitors.
  const supabase = await createSupabaseServerClient();

  const { data: gallery, error: galleryError } = await supabase
    .from("galleries")
    .select("id, title, client_name, cover_image_url, is_public")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (galleryError || !gallery) return null;

  const { data: photos } = await supabase
    .from("photos")
    .select("id, image_url, file_name")
    .eq("gallery_id", id)
    .order("created_at", { ascending: true });

  return {
    gallery,
    photos: photos ?? [],
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicGallery(id);

  if (!result) {
    return { title: "Gallery — LensBox" };
  }

  const { gallery } = result;
  return {
    title: `${gallery.title} — LensBox`,
    description: gallery.client_name
      ? `A private gallery for ${gallery.client_name}.`
      : "A private gallery on LensBox.",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPublicGallery(id);

  // Gallery doesn't exist or is_public = false → 404
  if (!result) notFound();

  const { gallery, photos } = result;

  return (
    <ClientGalleryView
      gallery={{
        id: gallery.id,
        title: gallery.title,
        client: gallery.client_name ?? "Your client",
        cover: gallery.cover_image_url ?? "",
        photos: photos.length,
      }}
      photos={photos.map((p) => ({ id: p.id, src: p.image_url, name: p.file_name }))}
    />
  );
}