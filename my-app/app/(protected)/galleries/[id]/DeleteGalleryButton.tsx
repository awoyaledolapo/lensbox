"use client";

/**
 * DeleteGalleryButton.tsx
 *
 * A client component that renders the "Delete gallery" button in the danger
 * zone of the gallery detail page.
 *
 * On click it shows an in-line confirmation prompt before calling the
 * deleteGallery server action. This avoids accidentally wiping a gallery
 * with a single stray click.
 */

import { useState, useTransition } from "react";
import { deleteGallery } from "./actions";

interface Props {
  galleryId: string;
}

export function DeleteGalleryButton({ galleryId }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await deleteGallery(galleryId);
      // deleteGallery redirects on success; if we're still here it failed.
      if (!result.success) {
        setErrorMsg(result.error ?? "Failed to delete gallery. Please try again.");
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        {errorMsg && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}
        <span className="text-sm text-muted-foreground">Are you sure?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 border border-destructive/60 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-60"
        >
          {isPending ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Deleting…
            </>
          ) : (
            "Yes, delete"
          )}
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); setErrorMsg(null); }}
          disabled={isPending}
          className="inline-flex items-center justify-center border border-foreground/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      id="delete-gallery-btn"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center justify-center border border-foreground/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
    >
      Delete
    </button>
  );
}
