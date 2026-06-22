"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Gallery } from "@/lib/types/gallery";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO timestamp to a short relative/absolute string. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Cover image for a gallery card — real photo if available, initials fallback otherwise. */
function GalleryCover({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={coverUrl}
          alt={`${title} cover`}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const initials = title
    .split(" ")
    .filter((w) => w.length > 2) // skip small words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="flex aspect-[4/5] items-center justify-center bg-muted">
      <span className="font-display text-5xl text-muted-foreground/40 select-none">
        {initials}
      </span>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

/**
 * Client component for the galleries listing.
 * Receives real galleries from the parent Server Component and provides
 * client-side search filtering.
 */
export function GalleriesClient({ galleries }: { galleries: Gallery[] }) {
  const [q, setQ] = useState("");

  const filtered = galleries.filter((g) => {
    if (!q) return true;
    const query = q.toLowerCase();
    return (
      g.title.toLowerCase().includes(query) ||
      (g.client_name ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Search bar */}
      <div className="flex flex-col gap-4 border-b border-hairline pb-6 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            id="gallery-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by client or title…"
            className="w-full border border-hairline bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {galleries.length} {galleries.length === 1 ? "gallery" : "galleries"}
        </p>
      </div>

      {/* Grid */}
      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g) => (
          <Link key={g.id} href={`/galleries/${g.id}`} className="group block">
            <div className="overflow-hidden">
              <GalleryCover title={g.title} coverUrl={g.cover_image_url} />
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display truncate text-2xl">{g.title}</h3>
                {/* Access badge */}
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase border ${
                    g.is_public
                      ? "border-green-600/30 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      g.is_public ? "bg-green-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  {g.is_public ? "Link active" : "No access"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {g.client_name ?? "No client"} · Created {formatDate(g.created_at)}
              </p>
            </div>
          </Link>
        ))}

        {/* Empty state — no galleries at all */}
        {galleries.length === 0 && (
          <div className="col-span-full border border-hairline py-24 text-center">
            <p className="font-display text-2xl">No galleries yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first gallery to get started.
            </p>
            <a
              href="/galleries/new"
              className="mt-6 inline-flex items-center justify-center bg-foreground px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90"
            >
              New gallery
            </a>
          </div>
        )}

        {/* Empty state — search returned nothing */}
        {galleries.length > 0 && filtered.length === 0 && (
          <div className="col-span-full border border-hairline py-24 text-center">
            <p className="font-display text-2xl">No results for &ldquo;{q}&rdquo;</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different title or client name.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
