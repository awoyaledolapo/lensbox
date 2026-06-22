"use server";

import { revalidatePath } from "next/cache";
import { setGalleryPublic } from "@/lib/services/gallery.service";

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
