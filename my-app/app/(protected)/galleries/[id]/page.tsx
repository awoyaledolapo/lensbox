import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, GhostButton } from "@/app/components/AppShell";
import { getGalleryById } from "@/lib/services/gallery.service";
import { getAuthUser } from "@/lib/supabase/server";
import { GalleryDetailClient } from "./GalleryDetailClient";
import { ShareAccessSection } from "./ShareAccessSection";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gallery = await getGalleryById(id);
  return {
    title: gallery ? `${gallery.title} — LensBox` : "Gallery — LensBox",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch gallery and authenticated user in parallel.
  const [gallery, user] = await Promise.all([
    getGalleryById(id),
    getAuthUser(),
  ]);

  // getGalleryById returns null for both "not found" and "belongs to another
  // user" (RLS blocks it) — in both cases 404 is the correct response.
  if (!gallery) notFound();

  // This page is inside the (protected) layout which already redirects
  // unauthenticated users. If user is null here something is very wrong.
  if (!user) notFound();

  return (
    <AppShell
      eyebrow="Gallery"
      title={gallery.title}
      actions={<GhostButton href="/galleries">← All galleries</GhostButton>}
    >
      {/* Gallery meta */}
      <section className="grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-3">
        <div className="bg-background p-6 lg:p-8">
          <p className="eyebrow text-muted-foreground">Client</p>
          <p className="font-display mt-3 text-2xl">
            {gallery.client_name ?? <span className="text-muted-foreground">—</span>}
          </p>
        </div>
        <div className="bg-background p-6 lg:p-8">
          <p className="eyebrow text-muted-foreground">Created</p>
          <p className="font-display mt-3 text-2xl">{formatFullDate(gallery.created_at)}</p>
        </div>
        <div className="bg-background p-6 lg:p-8">
          <p className="eyebrow text-muted-foreground">Gallery ID</p>
          <p className="mt-3 font-mono text-xs text-muted-foreground break-all">{gallery.id}</p>
        </div>
      </section>

      {/* Photos section — fully client-side for interactivity */}
      <GalleryDetailClient gallery={gallery} userId={user.id} />

      {/* Share access section */}
      <ShareAccessSection gallery={gallery} />

      {/* Danger zone */}
      <section className="mt-20 border-t border-hairline pt-8">
        <h3 className="text-sm font-medium text-muted-foreground">Danger zone</h3>
        <div className="mt-4 flex items-center justify-between border border-hairline p-5">
          <div>
            <p className="text-sm">Delete this gallery</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently removes the gallery and all its photos. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center border border-foreground/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Delete
          </button>
        </div>
      </section>
    </AppShell>
  );
}
