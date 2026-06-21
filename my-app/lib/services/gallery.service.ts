import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Gallery } from "@/lib/types/gallery";

const GALLERY_COLUMNS =
  "id, user_id, title, client_name, cover_image_url, created_at";

/**
 * Fetch all galleries belonging to the currently authenticated user,
 * ordered newest first. Returns [] on error (logged to console).
 */
export async function getUserGalleries(): Promise<Gallery[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("galleries")
    .select(GALLERY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[gallery.service] getUserGalleries:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch a single gallery by ID.
 * Returns null if not found OR if it belongs to a different user (RLS blocks it).
 */
export async function getGalleryById(id: string): Promise<Gallery | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("galleries")
    .select(GALLERY_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — not an error, just not found / access denied
    if (error.code !== "PGRST116") {
      console.error("[gallery.service] getGalleryById:", error.message);
    }
    return null;
  }

  return data;
}

/**
 * Update the cover_image_url for a gallery.
 * Returns the updated Gallery row, or null on failure.
 * Uses the server client so it runs with the authenticated session cookie.
 */
export async function updateGalleryCover(
  galleryId: string,
  coverUrl: string
): Promise<Gallery | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("galleries")
    .update({ cover_image_url: coverUrl })
    .eq("id", galleryId)
    .select(GALLERY_COLUMNS)
    .single();

  if (error) {
    console.error("[gallery.service] updateGalleryCover:", error.message);
    return null;
  }

  return data;
}
