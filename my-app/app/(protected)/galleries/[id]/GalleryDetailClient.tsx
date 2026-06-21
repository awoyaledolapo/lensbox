"use client";

/**
 * GalleryDetailClient.tsx
 *
 * Client component for the Gallery Detail page.
 *
 * Responsibilities:
 *  - Loads the gallery's photos on mount via the browser Supabase client.
 *  - Renders the CoverUploader and refreshes cover when changed.
 *  - Renders the PhotoUploader and refreshes the photo grid after each upload.
 *  - Displays the photo grid with lazy-loaded images.
 *
 * The parent Server Component (page.tsx) passes gallery metadata + the
 * initial user ID so we don't need another round-trip for auth.
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoUploader } from "@/app/components/PhotoUploader";
import { getGalleryPhotos, uploadCoverPhoto } from "@/lib/services/upload.service";
import type { Photo } from "@/lib/types/photo";
import type { Gallery } from "@/lib/types/gallery";

// ─── Props ────────────────────────────────────────────────────────────────────

interface GalleryDetailClientProps {
  gallery: Gallery;
  userId: string;
}

// ─── Cover uploader ───────────────────────────────────────────────────────────

function CoverUploader({
  gallery,
  userId,
  onCoverChange,
}: {
  gallery: Gallery;
  userId: string;
  onCoverChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localCover, setLocalCover] = useState<string | null>(
    gallery.cover_image_url
  );

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg(null);

    const result = await uploadCoverPhoto(
      file,
      gallery.id,
      userId,
      setProgress
    );

    if (result.success) {
      setLocalCover(result.coverUrl);
      onCoverChange(result.coverUrl);
      setStatus("idle");
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isUploading = status === "uploading";

  return (
    <div className="mb-14">
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="eyebrow text-muted-foreground">Cover photo</span>
          <h2 className="font-display mt-3 text-3xl">
            {localCover ? "Gallery cover" : "No cover yet."}
          </h2>
        </div>
        {localCover && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center justify-center border border-foreground/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
          >
            {isUploading ? "Uploading…" : "Change cover"}
          </button>
        )}
      </div>

      {/* Cover preview / drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a cover photo — click to browse"
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading)
            inputRef.current?.click();
        }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith("image/")) void handleFile(file);
        }}
        className={[
          "group relative overflow-hidden border border-dashed outline-none transition-all duration-200",
          localCover ? "aspect-[3/1] cursor-pointer" : "flex aspect-[3/1] cursor-pointer flex-col items-center justify-center px-6 text-center",
          isUploading ? "pointer-events-none opacity-60" : "hover:border-foreground hover:bg-muted",
          !localCover ? "border-foreground/30 bg-muted/40" : "border-transparent",
        ].filter(Boolean).join(" ")}
      >
        {localCover ? (
          <>
            <Image
              src={localCover}
              alt="Gallery cover"
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="text-sm font-medium text-white">
                {isUploading ? "Uploading…" : "Click to change"}
              </span>
            </div>
            {/* Progress bar overlay while uploading */}
            {isUploading && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <span className="font-display text-4xl">⬛</span>
            <span className="mt-3 text-sm">
              {isUploading ? `Uploading… ${progress}%` : "Add a cover photo"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG or TIFF · Recommended 3:1 ratio · Drag &amp; drop or click
            </span>
            {isUploading && (
              <div className="mt-4 h-0.5 w-48 overflow-hidden bg-foreground/10">
                <div
                  className="h-full bg-foreground transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {status === "error" && errorMsg && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
        disabled={isUploading}
      />
    </div>
  );
}

// ─── Photo grid ───────────────────────────────────────────────────────────────

function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative aspect-square overflow-hidden bg-muted">
          <Image
            src={photo.image_url}
            alt={photo.file_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="w-full p-3">
              <p className="truncate text-xs text-white/90">{photo.file_name}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotosLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse bg-muted"
          aria-hidden
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GalleryDetailClient({ gallery, userId }: GalleryDetailClientProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  // Track cover URL locally so the UI updates instantly without a page reload.
  const [coverUrl, setCoverUrl] = useState<string | null>(gallery.cover_image_url);

  // ── Fetch photos ───────────────────────────────────────────────────────────

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const fetched = await getGalleryPhotos(gallery.id);
    setPhotos(fetched);
    setLoading(false);
  }, [gallery.id]);

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const photoCount = photos.length;

  return (
    <>
      {/* Cover photo section */}
      <section className="mt-14 border-t border-hairline pt-10">
        <CoverUploader
          gallery={{ ...gallery, cover_image_url: coverUrl }}
          userId={userId}
          onCoverChange={setCoverUrl}
        />
      </section>

      {/* Photos section */}
      <section className="mt-0 border-t border-hairline pt-10">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="eyebrow text-muted-foreground">Photos</span>
            <h2 className="font-display mt-3 text-3xl">
              {loading
                ? "Loading…"
                : photoCount === 0
                ? "No photos yet."
                : `${photoCount} photo${photoCount === 1 ? "" : "s"}`}
            </h2>
          </div>
        </div>

        {/* Uploader */}
        <PhotoUploader
          galleryId={gallery.id}
          userId={userId}
          onUploadComplete={fetchPhotos}
        />

        {/* Photo grid */}
        {loading ? (
          <div className="mt-8">
            <PhotosLoadingSkeleton />
          </div>
        ) : photoCount > 0 ? (
          <div className="mt-8">
            <PhotoGrid photos={photos} />
          </div>
        ) : null}
      </section>
    </>
  );
}
