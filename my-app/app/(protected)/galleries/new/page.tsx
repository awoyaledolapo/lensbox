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

// ─── Inline field error ───────────────────────────────────────────────────────

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive" role="alert">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
        <path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {message}
    </p>
  );
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function validateTitle(v: string): string | undefined {
  const s = v.trim();
  if (!s) return "Gallery title is required.";
  if (s.length < 2) return "Title must be at least 2 characters.";
  if (s.length > 120) return "Title must be 120 characters or fewer.";
  return undefined;
}

function validateClientName(v: string): string | undefined {
  const s = v.trim();
  if (s.length > 80) return "Client name must be 80 characters or fewer.";
  return undefined;
}

function validateExpires(v: string): string | undefined {
  if (!v) return undefined; // optional
  const d = new Date(v);
  if (isNaN(d.getTime())) return "Enter a valid date.";
  if (d < TODAY) return "Expiration date must be today or in the future.";
  return undefined;
}

function validateNote(v: string): string | undefined {
  if (v.length > 800) return "Welcome note must be 800 characters or fewer.";
  return undefined;
}

function validatePassphrase(v: string, required: boolean): string | undefined {
  if (!required) return undefined;
  const s = v.trim();
  if (!s) return "A passphrase is required when password protection is on.";
  if (s.length < 4) return "Passphrase must be at least 4 characters.";
  if (s.length > 128) return "Passphrase must be 128 characters or fewer.";
  return undefined;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormStatus =
  | { state: "idle" }
  | { state: "loading"; step: string }
  | { state: "error"; message: string }
  | { state: "success" };

type FieldErrors = {
  title?: string;
  client?: string;
  expires?: string;
  note?: string;
  passphrase?: string;
};

export default function NewGalleryPage() {
  const [password, setPassword] = useState(false);
  const [downloads, setDownloads] = useState(true);
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });

  // Per-field error messages
  const [errors, setErrors] = useState<FieldErrors>({});
  // Track which fields have been touched (blurred) so we only show errors after interaction
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Live field values (for character counters and real-time validation on touched fields)
  const [titleVal, setTitleVal] = useState("");
  const [clientVal, setClientVal] = useState("");
  const [expiresVal, setExpiresVal] = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [passphraseVal, setPassphraseVal] = useState("");

  // Cover image state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverProgress, setCoverProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isLoading = status.state === "loading";
  const isSuccess = status.state === "success";

  // ── Helpers ────────────────────────────────────────────────────────────────

  function touch(field: string) {
    setTouched((prev) => new Set(prev).add(field));
  }

  function setError(field: keyof FieldErrors, msg: string | undefined) {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }

  /** Returns the error only if the field has been touched */
  function visibleError(field: keyof FieldErrors): string | undefined {
    return touched.has(field) ? errors[field] : undefined;
  }

  // ── Live validation on change ──────────────────────────────────────────────

  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTitleVal(v);
    if (touched.has("title")) setError("title", validateTitle(v));
  }

  function onClientChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setClientVal(v);
    if (touched.has("client")) setError("client", validateClientName(v));
  }

  function onExpiresChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setExpiresVal(v);
    if (touched.has("expires")) setError("expires", validateExpires(v));
  }

  function onNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setNoteVal(v);
    if (touched.has("note")) setError("note", validateNote(v));
  }

  function onPassphraseChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPassphraseVal(v);
    if (touched.has("passphrase")) setError("passphrase", validatePassphrase(v, password));
  }

  // ── Blur handlers ──────────────────────────────────────────────────────────

  function onTitleBlur() {
    touch("title");
    setError("title", validateTitle(titleVal));
  }
  function onClientBlur() {
    touch("client");
    setError("client", validateClientName(clientVal));
  }
  function onExpiresBlur() {
    touch("expires");
    setError("expires", validateExpires(expiresVal));
  }
  function onNoteBlur() {
    touch("note");
    setError("note", validateNote(noteVal));
  }
  function onPassphraseBlur() {
    touch("passphrase");
    setError("passphrase", validatePassphrase(passphraseVal, password));
  }

  // ── Cover image selection ──────────────────────────────────────────────────

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
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

    // Touch all fields so all errors become visible
    const allFields = ["title", "client", "expires", "note", "passphrase"] as const;
    setTouched(new Set(allFields));

    // Run all validators at once
    const newErrors: FieldErrors = {
      title: validateTitle(titleVal),
      client: validateClientName(clientVal),
      expires: validateExpires(expiresVal),
      note: validateNote(noteVal),
      passphrase: validatePassphrase(passphraseVal, password),
    };
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

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
        title: titleVal.trim(),
        client_name: clientVal.trim() || null,
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
        noValidate
        className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-10">
          <fieldset className="space-y-6" disabled={isLoading || isSuccess}>
            <legend className="eyebrow text-muted-foreground">Details</legend>

            {/* Gallery title */}
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="title">
                Gallery title <span className="text-destructive" aria-hidden>*</span>
              </label>
              <input
                id="title"
                name="title"
                value={titleVal}
                onChange={onTitleChange}
                onBlur={onTitleBlur}
                placeholder="e.g. Harlow &amp; Finn — Coastal Wedding"
                aria-required="true"
                aria-invalid={!!visibleError("title")}
                aria-describedby={visibleError("title") ? "title-error" : undefined}
                className={`mt-3 w-full border-b bg-transparent pb-3 text-2xl font-display focus:outline-none transition-colors ${
                  visibleError("title")
                    ? "border-destructive focus:border-destructive"
                    : "border-hairline focus:border-foreground"
                }`}
              />
              <div className="flex items-start justify-between gap-4">
                <FieldError message={visibleError("title")} />
                <span
                  className={`ml-auto mt-1.5 shrink-0 text-xs ${
                    titleVal.length > 110 ? "text-destructive" : "text-muted-foreground/60"
                  }`}
                >
                  {titleVal.length}/120
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Client name */}
              <div>
                <label className="eyebrow text-muted-foreground" htmlFor="client">
                  Client name
                </label>
                <input
                  id="client"
                  name="client"
                  value={clientVal}
                  onChange={onClientChange}
                  onBlur={onClientBlur}
                  placeholder="Harlow Vance"
                  aria-invalid={!!visibleError("client")}
                  aria-describedby={visibleError("client") ? "client-error" : undefined}
                  className={`mt-3 w-full border bg-background px-4 py-3 text-sm focus:outline-none transition-colors ${
                    visibleError("client")
                      ? "border-destructive focus:border-destructive"
                      : "border-hairline focus:border-foreground"
                  }`}
                />
                <FieldError message={visibleError("client")} />
              </div>

              {/* Expiration date */}
              <div>
                <label className="eyebrow text-muted-foreground" htmlFor="expires">
                  Expiration date
                </label>
                <input
                  id="expires"
                  name="expires"
                  type="date"
                  value={expiresVal}
                  onChange={onExpiresChange}
                  onBlur={onExpiresBlur}
                  min={new Date().toISOString().split("T")[0]}
                  aria-invalid={!!visibleError("expires")}
                  aria-describedby={visibleError("expires") ? "expires-error" : undefined}
                  className={`mt-3 w-full border bg-background px-4 py-3 text-sm focus:outline-none transition-colors ${
                    visibleError("expires")
                      ? "border-destructive focus:border-destructive"
                      : "border-hairline focus:border-foreground"
                  }`}
                />
                <FieldError message={visibleError("expires")} />
              </div>
            </div>

            {/* Welcome note */}
            <div>
              <label className="eyebrow text-muted-foreground" htmlFor="note">
                Welcome note <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                rows={4}
                value={noteVal}
                onChange={onNoteChange}
                onBlur={onNoteBlur}
                placeholder="A few words your client will see when they open the gallery…"
                aria-invalid={!!visibleError("note")}
                aria-describedby={visibleError("note") ? "note-error" : undefined}
                className={`mt-3 w-full border bg-background px-4 py-3 text-sm focus:outline-none transition-colors resize-none ${
                  visibleError("note")
                    ? "border-destructive focus:border-destructive"
                    : "border-hairline focus:border-foreground"
                }`}
              />
              <div className="flex items-start justify-between gap-4">
                <FieldError message={visibleError("note")} />
                <span
                  className={`ml-auto mt-1.5 shrink-0 text-xs ${
                    noteVal.length > 720 ? "text-destructive" : "text-muted-foreground/60"
                  }`}
                >
                  {noteVal.length}/800
                </span>
              </div>
            </div>
          </fieldset>

          <fieldset disabled={isLoading || isSuccess}>
            <legend className="eyebrow text-muted-foreground">Access</legend>
            <div className="mt-2">
              <Toggle
                label="Password protection"
                description="Require clients to enter a passphrase before viewing the gallery."
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  // Re-validate passphrase whenever the toggle changes
                  if (touched.has("passphrase")) {
                    setError("passphrase", validatePassphrase(passphraseVal, v));
                  }
                  // Clear passphrase error when turning protection off
                  if (!v) setError("passphrase", undefined);
                }}
              />
              {password && (
                <div className="mb-6">
                  <label className="sr-only" htmlFor="passphrase">Passphrase</label>
                  <input
                    id="passphrase"
                    name="passphrase"
                    type="password"
                    value={passphraseVal}
                    onChange={onPassphraseChange}
                    onBlur={onPassphraseBlur}
                    placeholder="Set a passphrase (min. 4 characters)"
                    aria-required="true"
                    aria-invalid={!!visibleError("passphrase")}
                    aria-describedby={visibleError("passphrase") ? "passphrase-error" : undefined}
                    className={`w-full border bg-background px-4 py-3 text-sm focus:outline-none transition-colors ${
                      visibleError("passphrase")
                        ? "border-destructive focus:border-destructive"
                        : "border-hairline focus:border-foreground"
                    }`}
                  />
                  <FieldError message={visibleError("passphrase")} />
                </div>
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