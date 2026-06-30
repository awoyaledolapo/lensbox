"use client";

/**
 * GalleryDetailClient.tsx
 *
 * Client component for the Gallery Detail page.
 *
 * Responsibilities:
 *  - Loads the gallery photos on mount via the browser Supabase client.
 *  - Renders the CoverUploader and refreshes cover when changed.
 *  - Renders a single always-visible PhotoUploader; wording adapts based on
 *    whether the gallery already has photos.
 *  - Photo grid with per-image shimmer loading, hover overlay, and delete flow.
 *
 * Delete flow:
 *  1. Hover photo → trash icon appears.
 *  2. Click trash → confirmation modal (portal, always on top).
 *  3. Confirm → optimistic removal from local state + call deletePhoto().
 *  4. Success/failure toast at bottom-right.
 */

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoUploader } from "@/app/components/PhotoUploader";
import {
  getGalleryPhotos,
  uploadCoverPhoto,
  deletePhoto,
} from "@/lib/services/upload.service";
import type { Photo } from "@/lib/types/photo";
import type { Gallery } from "@/lib/types/gallery";

// ─── Props ────────────────────────────────────────────────────────────────────

interface GalleryDetailClientProps {
  gallery: Gallery;
  userId: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string; type: "success" | "error" };

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 border px-4 py-3 text-sm shadow-lg transition-all duration-300 ${
            t.type === "success"
              ? "border-foreground/20 bg-background text-foreground"
              : "border-destructive/40 bg-background text-destructive"
          }`}
          style={{ animation: "toastIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          {t.type === "success" ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
              <path d="M4.5 8l2.5 2.5L11.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
              <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-muted-foreground hover:text-foreground" aria-label="Dismiss">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({
  photo,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  photo: Photo;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isDeleting) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDeleting, onCancel]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ animation: "modalFadeIn 0.18s cubic-bezier(0.22,1,0.36,1) both" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm border border-hairline bg-background p-8 shadow-2xl"
        style={{ animation: "modalSlideUp 0.22s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Trash icon */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center border border-hairline text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>

        <h2 id="delete-modal-title" className="font-display mb-2 text-2xl leading-tight">
          Delete photo?
        </h2>
        <p className="mb-1 text-sm text-muted-foreground truncate">{photo.file_name}</p>
        <p className="mb-8 text-sm text-muted-foreground">
          This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            id="delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 bg-destructive px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Deleting…
              </>
            ) : (
              "Delete photo"
            )}
          </button>
          <button
            id="delete-cancel-btn"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center border border-foreground px-5 py-2.5 text-sm transition-colors hover:bg-foreground hover:text-background disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
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
  const [localCover, setLocalCover] = useState<string | null>(gallery.cover_image_url);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg(null);

    const result = await uploadCoverPhoto(file, gallery.id, userId, setProgress);

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

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a cover photo — click to browse"
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) inputRef.current?.click();
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
          localCover
            ? "aspect-[3/1] cursor-pointer"
            : "flex aspect-[3/1] cursor-pointer flex-col items-center justify-center px-6 text-center",
          isUploading ? "pointer-events-none opacity-60" : "hover:border-foreground hover:bg-muted",
          !localCover ? "border-foreground/30 bg-muted/40" : "border-transparent",
        ].filter(Boolean).join(" ")}
      >
        {localCover ? (
          <>
            <Image src={localCover} alt="Gallery cover" fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="text-sm font-medium text-white">
                {isUploading ? "Uploading…" : "Click to change"}
              </span>
            </div>
            {isUploading && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
                <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
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
                <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        )}
      </div>

      {status === "error" && errorMsg && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} disabled={isUploading} />
    </div>
  );
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

function PhotosLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square overflow-hidden bg-muted" aria-hidden>
          <div className="shimmer h-full w-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Photo cell ───────────────────────────────────────────────────────────────

function PhotoCell({
  photo,
  onDeleteRequest,
}: {
  photo: Photo;
  onDeleteRequest: (photo: Photo) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="group relative aspect-square overflow-hidden bg-muted">
      {/* Shimmer until image loads */}
      {!loaded && <div className="absolute inset-0 shimmer" />}

      <Image
        src={photo.image_url}
        alt={photo.file_name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className={`object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
        unoptimized
        onLoad={() => setLoaded(true)}
      />

      {/* Hover overlay — dark gradient + filename */}
      {loaded && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="w-full p-3">
            <p className="truncate text-xs text-white/80">{photo.file_name}</p>
          </div>
        </div>
      )}

      {/* Delete button — top-right, visible on hover */}
      {loaded && (
        <button
          type="button"
          aria-label={`Delete ${photo.file_name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest(photo);
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-white/30 bg-black/50 text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-white/60 hover:bg-black/70 group-hover:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}

function PhotoGrid({
  photos,
  onDeleteRequest,
}: {
  photos: Photo[];
  onDeleteRequest: (photo: Photo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <PhotoCell key={photo.id} photo={photo} onDeleteRequest={onDeleteRequest} />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GalleryDetailClient({ gallery, userId }: GalleryDetailClientProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(gallery.cover_image_url);

  // Delete state
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch photos ───────────────────────────────────────────────────────────

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const fetched = await getGalleryPhotos(gallery.id);
    setPhotos(fetched);
    setLoading(false);
  }, [gallery.id]);

  useEffect(() => { void fetchPhotos(); }, [fetchPhotos]);

  const handleUploadComplete = useCallback(async () => {
    await fetchPhotos();
  }, [fetchPhotos]);

  // ── Toast helpers ──────────────────────────────────────────────────────────

  function pushToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Delete handlers ────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!photoToDelete) return;
    setIsDeleting(true);

    // Optimistic: remove from local state immediately for instant feel
    setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));

    const result = await deletePhoto(photoToDelete);

    setIsDeleting(false);
    setPhotoToDelete(null);

    if (result.success) {
      pushToast("Photo deleted.", "success");
    } else {
      // Revert optimistic removal on failure
      setPhotos((prev) => [photoToDelete, ...prev]);
      pushToast(result.error ?? "Failed to delete photo. Please try again.", "error");
    }
  }

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

      {/* Photos section — single always-visible uploader */}
      <section className="mt-0 border-t border-hairline pt-10">
        {/* Section header — wording changes based on photo count */}
        <div className="mb-6">
          <span className="eyebrow text-muted-foreground">Photos</span>
          <h2 className="font-display mt-3 text-3xl">
            {loading
              ? "Loading…"
              : photoCount === 0
              ? "No photos yet."
              : `${photoCount} photo${photoCount === 1 ? "" : "s"}`}
          </h2>
        </div>

        {/* Photo grid — only shown when photos exist */}
        {loading ? (
          <PhotosLoadingSkeleton />
        ) : photoCount > 0 ? (
          <PhotoGrid photos={photos} onDeleteRequest={setPhotoToDelete} />
        ) : null}

        {/* Upload zone — always visible, wording adapts */}
        {!loading && (
          <div className={photoCount > 0 ? "mt-8" : ""}>
            <PhotoUploader
              galleryId={gallery.id}
              userId={userId}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </section>

      {/* Delete confirmation modal — portal, always on top */}
      {mounted && photoToDelete && (
        <DeleteModal
          photo={photoToDelete}
          onCancel={() => !isDeleting && setPhotoToDelete(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      {/* Toast notifications */}
      {mounted && <ToastStack toasts={toasts} onDismiss={dismissToast} />}
    </>
  );
}
