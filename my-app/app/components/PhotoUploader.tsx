"use client";

/**
 * PhotoUploader.tsx
 *
 * A self-contained drag-and-drop + click-to-browse image uploader component.
 *
 * Features:
 *  - Drag-and-drop zone with visual active/hover states
 *  - Click to open file browser (multiple selection, image/* only)
 *  - Per-file upload progress bars
 *  - Per-file success / error states
 *  - Calls onUploadComplete when all files finish so the parent can refresh
 */

import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import type { UploadItem } from "@/lib/types/photo";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhotoUploaderProps {
  galleryId: string;
  userId: string;
  /** Called after every batch completes (success or partial failure). */
  onUploadComplete: () => void;
  /**
   * Optional external ref attached to the hidden file input.
   * Lets a parent component programmatically trigger the file picker
   * (e.g. by calling `inputRef.current?.click()`).
   */
  inputRef?: RefObject<HTMLInputElement | null>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-0.5 w-full overflow-hidden bg-foreground/10 mt-2">
      <div
        className="h-full bg-foreground transition-all duration-300 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatusIcon({ status }: { status: UploadItem["status"] }) {
  if (status === "success") {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-green-600"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
        <path
          d="M4.5 8l2.5 2.5L11.5 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-destructive"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
        <path
          d="M5.5 5.5l5 5M10.5 5.5l-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (status === "uploading") {
    return (
      <svg
        className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="28"
          strokeDashoffset="10"
        />
      </svg>
    );
  }
  // pending
  return (
    <svg
      className="h-4 w-4 shrink-0 text-muted-foreground/40"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PhotoUploader({
  galleryId,
  userId,
  onUploadComplete,
  inputRef: externalInputRef,
}: PhotoUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  // Use the external ref when provided, otherwise fall back to the internal one.
  const inputRef = externalInputRef ?? internalInputRef;

  // ── State helpers ──────────────────────────────────────────────────────────

  function initItems(files: File[]): UploadItem[] {
    return files.map((file) => ({
      id: fileId(file),
      file,
      status: "pending" as const,
      progress: 0,
    }));
  }

  function patchItem(
    id: string,
    patch: Partial<Omit<UploadItem, "id" | "file">>
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  // ── Upload logic ───────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isUploading) return;

      const newItems = initItems(files);

      // Add all items as "uploading" immediately.
      setItems((prev) => [
        ...prev,
        ...newItems.map((i) => ({ ...i, status: "uploading" as const })),
      ]);
      setIsUploading(true);

      const { uploadPhotos: upload } = await import(
        "@/lib/services/upload.service"
      );

      const results = await upload(
        files,
        galleryId,
        userId,
        (fileIndex, progress) => {
          const id = newItems[fileIndex]?.id;
          if (id) patchItem(id, { progress });
        }
      );

      // Apply results to state.
      results.forEach((result, i) => {
        const id = newItems[i]?.id;
        if (!id) return;
        if (result.success) {
          patchItem(id, {
            status: "success",
            progress: 100,
            url: result.publicUrl,
          });
        } else {
          patchItem(id, {
            status: "error",
            progress: 0,
            error: result.error,
          });
        }
      });

      setIsUploading(false);
      onUploadComplete();
    },
    [galleryId, userId, isUploading, onUploadComplete]
  );

  // ── Drag events ────────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      void handleFiles(files);
    },
    [handleFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      void handleFiles(files);
      // Reset so the same files can be selected again.
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasItems = items.length > 0;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photos — drag and drop or click to browse"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={[
          "flex aspect-video cursor-pointer flex-col items-center justify-center border border-dashed px-6 text-center transition-all duration-200 select-none outline-none",
          isDragOver
            ? "border-foreground bg-muted scale-[1.01]"
            : "border-foreground/30 bg-muted/40 hover:border-foreground hover:bg-muted",
          isUploading ? "pointer-events-none opacity-60" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isDragOver ? (
          <>
            <span className="font-display text-4xl">↓</span>
            <span className="mt-3 text-sm">Drop to upload</span>
          </>
        ) : (
          <>
            <span className="font-display text-4xl">＋</span>
            <span className="mt-3 text-sm">
              {isUploading
                ? "Uploading…"
                : hasItems
                ? "Add more photos"
                : "Upload photos to this gallery"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG or TIFF · Up to 50 MB each · Drag &amp; drop or click
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef as RefObject<HTMLInputElement>}
        id="photo-upload-input"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInputChange}
        disabled={isUploading}
      />

      {/* Upload queue */}
      {hasItems && (
        <div className="border border-hairline">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="eyebrow text-muted-foreground">Upload queue</span>
            <span className="text-xs text-muted-foreground">
              {successCount}/{items.length} done
              {errorCount > 0 && (
                <span className="ml-2 text-destructive">
                  · {errorCount} failed
                </span>
              )}
            </span>
          </div>

          {/* File list */}
          <ul className="divide-y divide-hairline max-h-72 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {item.file.name}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatBytes(item.file.size)}
                      </span>
                    </div>
                    {item.status === "uploading" && (
                      <ProgressBar value={item.progress} />
                    )}
                    {item.status === "error" && (
                      <p className="mt-1 text-xs text-destructive">
                        {item.error ?? "Upload failed"}
                      </p>
                    )}
                    {item.status === "success" && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Uploaded successfully
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
