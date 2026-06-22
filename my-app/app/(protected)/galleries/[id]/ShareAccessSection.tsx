"use client";

/**
 * ShareAccessSection.tsx
 *
 * Lets the gallery owner toggle link-based access on/off.
 *
 * - is_public = true  → the /g/[id] link is active. Anyone with it can view.
 * - is_public = false → the link returns 404. Effectively revokes client access.
 *
 * The label deliberately never says "public" — it frames this as "sharing a
 * private link with your client", which is the mental model photographers want.
 */

import { useState, useTransition } from "react";
import type { Gallery } from "@/lib/types/gallery";
import { toggleGalleryAccess } from "./actions";

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input manually
    }
  }

  return (
    <div className="mt-4 flex items-center gap-0">
      <input
        id="shareable-link"
        readOnly
        value={url}
        className="min-w-0 flex-1 border border-hairline bg-muted px-4 py-2.5 font-mono text-xs text-muted-foreground focus:outline-none"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 border border-l-0 border-hairline bg-background px-4 py-2.5 text-xs transition-colors hover:border-foreground hover:text-foreground"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function AccessToggle({
  galleryId,
  isPublic,
}: {
  galleryId: string;
  isPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticPublic, setOptimisticPublic] = useState(isPublic);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !optimisticPublic;
    setOptimisticPublic(next); // instant UI feedback
    setError(null);

    startTransition(async () => {
      const result = await toggleGalleryAccess(galleryId, next);
      if (!result.success) {
        setOptimisticPublic(!next); // revert
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  // NEXT_PUBLIC_APP_URL is set in .env (localhost in dev, real domain in prod).
  // Falls back to window.location.origin only if the var is somehow missing.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = `${baseUrl}/g/${galleryId}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm">
            {optimisticPublic ? (
              <>
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 align-middle" />
                Link is active — your client can view this gallery
              </>
            ) : (
              <>
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-muted-foreground/40 align-middle" />
                Link is inactive — access has been revoked
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {optimisticPublic
              ? "Anyone with the link below can view the gallery. Only people you share it with will find it."
              : "The gallery link will return a 404. Re-enable to restore access."}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          id="gallery-access-toggle"
          aria-checked={optimisticPublic}
          onClick={handleToggle}
          disabled={isPending}
          className={[
            "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none disabled:opacity-50",
            optimisticPublic
              ? "border-foreground bg-foreground"
              : "border-hairline bg-muted",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform duration-200",
              optimisticPublic
                ? "translate-x-5 bg-background"
                : "translate-x-0 bg-muted-foreground/40",
            ].join(" ")}
          />
          <span className="sr-only">
            {optimisticPublic ? "Revoke access" : "Share link"}
          </span>
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}

      {/* Only show the link when access is on */}
      {optimisticPublic && <CopyLinkButton url={shareUrl} />}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

export function ShareAccessSection({ gallery }: { gallery: Gallery }) {
  return (
    <section className="mt-20 border-t border-hairline pt-8">
      <h3 className="text-sm font-medium text-muted-foreground">
        Client access
      </h3>
      <div className="mt-4 border border-hairline p-5">
        <AccessToggle
          galleryId={gallery.id}
          isPublic={gallery.is_public}
        />
      </div>
    </section>
  );
}
