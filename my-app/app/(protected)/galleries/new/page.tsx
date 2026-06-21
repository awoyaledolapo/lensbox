"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AppShell, GhostButton, PrimaryButton } from "@/app/components/AppShell";
import { supabase } from "@/lib/supabase/client";
import { uploadCoverPhoto } from "@/lib/services/upload.service";
import type { GalleryInsert } from "@/lib/types/gallery";

// ─── Toggle sub-component ─────────────────────────────────────────────────────

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-hairline py-6">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative h-7 w-12 shrink-0 border transition-colors ${
          value ? "border-foreground bg-foreground" : "border-hairline bg-background"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 transition-transform ${
            value ? "translate-x-6 bg-background" : "translate-x-0.5 bg-foreground"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormStatus =
  | { state: "idle" }
  | { state: "loading"; step: string }
  | { state: "error"; message: string }
  | { state: "success" };

export default function NewGalleryPage() {
  const [password, setPassword] = useState(false);
  const [downloads, setDownloads] = useState(true);
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });

  // Cover image state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverProgress, setCoverProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isLoading = status.state === "loading";
  const isSuccess = status.state === "success";

  // ── Cover image selection ──────────────────────────────────────────────────

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    // Generate a local object URL for the preview
    setCoverPreview(URL.createObjectURL(file));
  }

  function removeCover() {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  // ── Form submit ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const clientName = (form.elements.namedItem("client") as HTMLInputElement).value.trim();

    if (!title) {
      setStatus({ state: "error", message: "Gallery title is required." });
      return;
    }

    setStatus({ state: "loading", step: "Creating gallery…" });

    try {
      // 1. Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus({ state: "error", message: "You must be signed in to create a gallery." });
        return;
      }

      // 2. Insert the gallery row — select the new ID back
      const insert: GalleryInsert = {
        title,
        client_name: clientName || null,
        user_id: user.id,
      };

      const { data: newGallery, error: insertError } = await supabase
        .from("galleries")
        .insert(insert)
        .select("id")
        .single();

      if (insertError || !newGallery) {
        setStatus({ state: "error", message: insertError?.message ?? "Failed to create gallery." });
        return;
      }

      const galleryId = newGallery.id as string;

      // 3. Upload cover photo if one was selected
      if (coverFile) {
        setStatus({ state: "loading", step: "Uploading cover photo…" });
        setCoverProgress(0);

        const result = await uploadCoverPhoto(
          coverFile,
          galleryId,
          user.id,
          setCoverProgress
        );

        if (!result.success) {
          // Non-fatal — gallery was created, cover just failed. Navigate anyway.
          console.warn("[new-gallery] Cover upload failed:", result.error);
        }
      }

      setStatus({ state: "success" });

      // 4. Redirect to the newly created gallery detail page
      window.location.href = `/galleries/${galleryId}`;
    } catch {
      setStatus({
        state: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const loadingStep = status.state === "loading" ? status.step : "";

  return (
    <AppShell
      eyebrow="Step 01 — Setup"
      title="New gallery"
      actions={
        <>
          <GhostButton href="/galleries">Cancel</GhostButton>
          <PrimaryButton
            type="submit"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>("#new-gallery-form");
              form?.requestSubmit();
            }}
          >
            {isLoading ? loadingStep : "Create gallery"}
          </PrimaryButton>
        </>
      }
    >
      {status.state === "error" && (
        <p className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </p>
      )}

      <form
        id="new-gallery-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-10">
          <fieldset className="space-y-6" disabled={isLoading || isSuccess}>
            <legend className="eyebrow text-muted-foreground">Details</legend>
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="title">
                Gallery title
              </label>
              <input
                id="title"
                name="title"
                required
                placeholder="e.g. Harlow &amp; Finn — Coastal Wedding"
                className="mt-3 w-full border-b border-hairline bg-transparent pb-3 text-2xl font-display focus:border-foreground focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="eyebrow text-muted-foreground" htmlFor="client">
                  Client name
                </label>
                <input
                  id="client"
                  name="client"
                  placeholder="Harlow Vance"
                  className="mt-3 w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="eyebrow text-muted-foreground" htmlFor="expires">
                  Expiration date
                </label>
                <input
                  id="expires"
                  name="expires"
                  type="date"
                  className="mt-3 w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="note">
                Welcome note (optional)
              </label>
              <textarea
                id="note"
                name="note"
                rows={4}
                placeholder="A few words your client will see when they open the gallery…"
                className="mt-3 w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </div>
          </fieldset>

          <fieldset disabled={isLoading || isSuccess}>
            <legend className="eyebrow text-muted-foreground">Access</legend>
            <div className="mt-2">
              <Toggle
                label="Password protection"
                description="Require clients to enter a passphrase before viewing the gallery."
                value={password}
                onChange={setPassword}
              />
              {password && (
                <input
                  name="passphrase"
                  placeholder="Set a passphrase"
                  className="mb-6 w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
                />
              )}
              <Toggle
                label="Allow downloads"
                description="Clients can download high-resolution files individually or in bulk."
                value={downloads}
                onChange={setDownloads}
              />
              <Toggle
                label="Show favorites to client"
                description="Let your client mark photos as favorites and share them with you."
                value={true}
                onChange={() => {}}
              />
            </div>
          </fieldset>
        </div>

        {/* ── Cover image uploader ── */}
        <aside>
          <p className="eyebrow text-muted-foreground">Cover image</p>

          {coverPreview ? (
            // Preview of selected file
            <div className="mt-3 relative aspect-[4/5] overflow-hidden bg-muted group">
              <Image
                src={coverPreview}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized
              />

              {/* Upload progress overlay while submitting */}
              {isLoading && coverProgress > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <p className="text-sm font-medium text-white">{coverProgress}%</p>
                  <div className="mt-3 h-0.5 w-32 overflow-hidden bg-white/20">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${coverProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Remove button — hidden during upload */}
              {!isLoading && (
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                  aria-label="Remove cover image"
                >
                  ✕
                </button>
              )}

              {/* Re-pick overlay */}
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <span className="bg-black/60 px-3 py-1 text-xs text-white">
                    Change cover
                  </span>
                </button>
              )}
            </div>
          ) : (
            // Empty drop zone
            <label
              htmlFor="cover-input"
              className="mt-3 flex aspect-[4/5] cursor-pointer flex-col items-center justify-center border border-dashed border-foreground/30 bg-muted/40 px-6 text-center transition-colors hover:border-foreground hover:bg-muted"
            >
              <span className="font-display text-3xl">＋</span>
              <span className="mt-3 text-sm">Upload cover image</span>
              <span className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or TIFF · Up to 50 MB
              </span>
            </label>
          )}

          <input
            ref={coverInputRef}
            id="cover-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
            disabled={isLoading || isSuccess}
          />

          <div className="mt-6 border border-hairline p-5 text-xs text-muted-foreground">
            The cover image is the first thing your client sees. Choose a hero
            frame that sets the tone of the story.
          </div>
        </aside>
      </form>
    </AppShell>
  );
}