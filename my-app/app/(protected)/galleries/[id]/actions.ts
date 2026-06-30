"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setGalleryPublic } from "@/lib/services/gallery.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server Action: toggle whether a gallery is publicly accessible via /g/[id].
 * - isPublic = true  → anyone with the link can view the gallery
 * - isPublic = false → the link returns 404 (RLS blocks anon reads)
 */
export async function toggleGalleryAccess(
  galleryId: string,
  isPublic: boolean
): Promise<{ success: boolean; error?: string }> {
  const updated = await setGalleryPublic(galleryId, isPublic);

  if (!updated) {
    return { success: false, error: "Failed to update gallery access." };
  }

  // Revalidate both the detail page and the galleries list so badges update.
  revalidatePath(`/galleries/${galleryId}`);
  revalidatePath("/galleries");

  return { success: true };
}

/**
 * Server Action: permanently delete a gallery and all its photos.
 * Redirects to /galleries on success.
 */
export async function deleteGallery(
  galleryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("galleries")
    .delete()
    .eq("id", galleryId);

  if (error) {
    console.error("[actions] deleteGallery:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/galleries");
  redirect("/galleries");
}
