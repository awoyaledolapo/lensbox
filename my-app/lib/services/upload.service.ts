/**
 * upload.service.ts
 *
 * Reusable functions for uploading images to Supabase Storage and inserting
 * the resulting photo record into the `photos` table.
 *
 * Kept intentionally free of React/UI concerns so it can be used from any
 * component or future server action without modification.
 */

import { supabase } from "@/lib/supabase/client";
import type { Photo, PhotoInsert } from "@/lib/types/photo";

/** The Supabase Storage bucket that holds gallery images. */
const BUCKET = "gallery-photos";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadProgressCallback = (progress: number) => void;

export type UploadResult =
  | { success: true; photo: Photo; publicUrl: string }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the storage path for a file.
 * Format: {userId}/{galleryId}/{fileName}
 */
function buildStoragePath(
  userId: string,
  galleryId: string,
  fileName: string
): string {
  // Sanitise the file name: replace spaces and special chars to be URL-safe.
  const sanitised = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Prefix with a timestamp to avoid collisions when the same name is re-uploaded.
  const unique = `${Date.now()}_${sanitised}`;
  return `${userId}/${galleryId}/${unique}`;
}

/**
 * Derives the public URL for an already-uploaded storage object.
 * Uses getPublicUrl (no network request needed — bucket must be public)
 * OR falls back to createSignedUrl for private buckets.
 *
 * The `gallery-images` bucket is declared **private**, so we use
 * createSignedUrl with a long expiry (10 years ≈ permanent for our purposes).
 * Store the signed URL in the DB; rotate periodically via a background job if needed.
 */
async function getSignedUrl(path: string): Promise<string | null> {
  const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("[upload.service] createSignedUrl:", error?.message);
    return null;
  }

  return data.signedUrl;
}

// ─── Core upload function ─────────────────────────────────────────────────────

/**
 * Uploads a single File to Supabase Storage, then inserts a row into `photos`.
 *
 * @param file        - The File object selected by the user.
 * @param galleryId   - The gallery this photo belongs to.
 * @param userId      - The authenticated user's ID (from supabase.auth.getUser()).
 * @param onProgress  - Optional callback receiving 0–100 upload progress.
 *
 * @returns UploadResult — success with the inserted Photo row, or failure with an error string.
 */
export async function uploadPhoto(
  file: File,
  galleryId: string,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  // 1. Build the storage path.
  const storagePath = buildStoragePath(userId, galleryId, file.name);

  // 2. Report ~10% immediately so the UI feels responsive.
  onProgress?.(10);

  // 3. Upload to Supabase Storage.
  //    Note: The JS SDK does not expose real byte-level progress for browser uploads.
  //    We simulate meaningful steps: 10% → 60% (during upload) → 80% (getting URL) → 100%.
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (storageError) {
    console.error("[upload.service] storage upload:", storageError.message);
    return { success: false, error: storageError.message };
  }

  onProgress?.(70);

  // 4. Get the signed URL (private bucket).
  const signedUrl = await getSignedUrl(storagePath);

  if (!signedUrl) {
    return { success: false, error: "Failed to generate image URL after upload." };
  }

  onProgress?.(85);

  // 5. Insert the photo record into the database.
  const insert: PhotoInsert = {
    gallery_id: galleryId,
    user_id: userId,
    image_url: signedUrl,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  };

  const { data: photoRow, error: dbError } = await supabase
    .from("photos")
    .insert(insert)
    .select(
      "id, gallery_id, user_id, image_url, file_name, file_size, mime_type, created_at"
    )
    .single();

  if (dbError || !photoRow) {
    console.error("[upload.service] photos insert:", dbError?.message);
    // Clean up the orphaned storage object.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return {
      success: false,
      error: dbError?.message ?? "Failed to save photo record.",
    };
  }

  onProgress?.(100);

  return { success: true, photo: photoRow as Photo, publicUrl: signedUrl };
}

// ─── Batch upload ─────────────────────────────────────────────────────────────

/**
 * Uploads multiple files concurrently (capped at 3 parallel uploads to avoid
 * overwhelming the connection).
 *
 * @param files       - Array of File objects.
 * @param galleryId   - Target gallery ID.
 * @param userId      - Authenticated user ID.
 * @param onFileProgress - Called with (fileIndex, 0-100) as each file progresses.
 *
 * @returns Array of UploadResult in the same order as `files`.
 */
export async function uploadPhotos(
  files: File[],
  galleryId: string,
  userId: string,
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> {
  const CONCURRENCY = 3;
  const results: UploadResult[] = new Array(files.length);

  // Process in chunks.
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((file, j) => {
        const fileIndex = i + j;
        return uploadPhoto(file, galleryId, userId, (progress) => {
          onFileProgress?.(fileIndex, progress);
        });
      })
    );
    chunkResults.forEach((r, j) => {
      results[i + j] = r;
    });
  }

  return results;
}

// ─── Fetch photos ─────────────────────────────────────────────────────────────

/**
 * Fetches all photos for a given gallery, ordered oldest first.
 * Uses the browser client so RLS is enforced with the current user's session.
 */
export async function getGalleryPhotos(galleryId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, gallery_id, user_id, image_url, file_name, file_size, mime_type, created_at"
    )
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[upload.service] getGalleryPhotos:", error.message);
    return [];
  }

  return (data ?? []) as Photo[];
}

// ─── Cover photo ──────────────────────────────────────────────────────────────

export type CoverUploadResult =
  | { success: true; coverUrl: string }
  | { success: false; error: string };

/**
 * Uploads a cover image to Supabase Storage, generates a signed URL,
 * then writes it back to galleries.cover_image_url using the browser client.
 *
 * Storage path: {userId}/{galleryId}/cover_{timestamp}_{fileName}
 *
 * @param file      - The cover image File selected by the user.
 * @param galleryId - The target gallery ID.
 * @param userId    - The authenticated user ID.
 * @param onProgress - Optional 0-100 progress callback.
 */
export async function uploadCoverPhoto(
  file: File,
  galleryId: string,
  userId: string,
  onProgress?: (pct: number) => void
): Promise<CoverUploadResult> {
  const sanitised = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${galleryId}/cover_${Date.now()}_${sanitised}`;

  onProgress?.(10);

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: true });

  if (storageError) {
    console.error("[upload.service] cover upload:", storageError.message);
    return { success: false, error: storageError.message };
  }

  onProgress?.(65);

  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { data: urlData, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, TEN_YEARS);

  if (urlError || !urlData?.signedUrl) {
    console.error("[upload.service] cover signed URL:", urlError?.message);
    return { success: false, error: "Failed to generate cover image URL." };
  }

  onProgress?.(80);

  // Write cover_image_url back to the galleries row (browser client — RLS enforced).
  const { error: dbError } = await supabase
    .from("galleries")
    .update({ cover_image_url: urlData.signedUrl })
    .eq("id", galleryId);

  if (dbError) {
    console.error("[upload.service] cover DB update:", dbError.message);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { success: false, error: dbError.message };
  }

  onProgress?.(100);

  return { success: true, coverUrl: urlData.signedUrl };
}

// ─── Delete photo ─────────────────────────────────────────────────────────────

export type DeletePhotoResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Extracts the storage object path from a Supabase signed URL.
 *
 * Supabase signed URL format:
 *   https://<project>.supabase.co/storage/v1/sign/<bucket>/<path...>?token=...
 *
 * We need the portion after /sign/<bucket>/ — i.e., the object key inside the bucket.
 */
function extractStoragePath(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl);
    const marker = `/sign/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

/**
 * Deletes a photo from Supabase Storage and removes its row from `photos`.
 *
 * Strategy:
 *  1. Extract the storage path from the signed URL stored in the DB row.
 *  2. Remove the storage object — non-fatal if already gone (we still clean up the DB row).
 *  3. Delete the `photos` row — fatal on failure (orphaned row would keep photo visible).
 *
 * RLS: uses the browser Supabase client so all policies are enforced with the
 * current user's session.
 */
export async function deletePhoto(photo: Photo): Promise<DeletePhotoResult> {
  // 1. Derive the storage path from the signed URL.
  const storagePath = extractStoragePath(photo.image_url);

  if (storagePath) {
    // 2. Remove from storage. Log but don't fail if the object is already gone.
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (storageError) {
      console.warn(
        "[upload.service] deletePhoto storage remove (non-fatal):",
        storageError.message
      );
    }
  } else {
    console.warn(
      "[upload.service] deletePhoto: could not extract storage path — skipping storage delete."
    );
  }

  // 3. Delete the photos row.
  const { error: dbError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photo.id);

  if (dbError) {
    console.error("[upload.service] deletePhoto DB delete:", dbError.message);
    return { success: false, error: dbError.message };
  }

  return { success: true };
}
