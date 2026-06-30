"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type GalleryProps = {
  id: string;
  title: string;
  client: string;
  cover: string;
  photos: number;
};

type PhotoItem = {
  id: string;
  src: string;
  name: string;
};

export function ClientGalleryView({
  gallery,
  photos,
}: {
  gallery: GalleryProps;
  photos: PhotoItem[];
}) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { author: gallery.client, text: "These are absolutely beautiful — thank you.", time: "Yesterday" },
    { author: "Studio", text: "So glad you love them. Let us know your favorites by Friday.", time: "2 days ago" },
  ]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /**
   * Force-download a photo via our /api/download proxy.
   *
   * The HTML `download` attribute is ignored for cross-origin URLs (browser
   * security). Photos live on Supabase's CDN domain, so we proxy them through
   * our own server which adds Content-Disposition: attachment.
   */
  async function handleDownload(src: string, name: string) {
    try {
      const params = new URLSearchParams({ url: src, name });
      const res = await fetch(`/api/download?${params.toString()}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("[download]", err);
    }
  }

  const lightboxPhoto = photos.find((p) => p.id === lightbox);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-[1500px] px-6 pt-10 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link href="/" className="font-display text-xl">
              Lens<span className="italic">Box</span>
            </Link>
            <span className="text-muted-foreground">A private gallery for {gallery.client}</span>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-[1500px] px-6 sm:px-10">
          <span className="eyebrow text-muted-foreground">Presented by LensBox Studio</span>
          <h1 className="font-display mt-5 text-5xl leading-[0.95] sm:text-6xl lg:text-[5.5rem]">
            {gallery.title}
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            A selection of {gallery.photos} photographs. Take your time — tap the heart on the frames
            you love, and download anything that calls to you.
          </p>
        </div>
        {gallery.cover && (
          <div className="relative mx-auto mt-14 aspect-[16/9] max-w-[1500px] overflow-hidden bg-muted">
            <Image src={gallery.cover} alt={gallery.title} fill className="object-cover" unoptimized />
          </div>
        )}
      </header>

      {/* Photos */}
      <section className="mx-auto max-w-[1500px] px-6 py-16 sm:px-10 sm:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="eyebrow text-muted-foreground">The selection</span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">{photos.length} frames</h2>
          </div>
          <p className="text-sm text-muted-foreground">{favorites.size} favorited</p>
        </div>

        {photos.length === 0 ? (
          <div className="border border-hairline py-24 text-center">
            <p className="font-display text-2xl text-muted-foreground">No photos yet.</p>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {photos.map((photo) => {
              const fav = favorites.has(photo.id);
              return (
                <figure key={photo.id} className="group relative mb-5 break-inside-avoid">
                  <button
                    onClick={() => setLightbox(photo.id)}
                    className="block w-full overflow-hidden bg-muted"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.name}
                      width={800}
                      height={1000}
                      loading="lazy"
                      unoptimized
                      className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </button>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => toggleFav(photo.id)}
                      className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 text-xs ${
                        fav ? "bg-foreground text-background" : "bg-background text-foreground"
                      }`}
                    >
                      {fav ? "♥ Favorited" : "♡ Favorite"}
                    </button>
                    <button
                      onClick={() => handleDownload(photo.src, photo.name)}
                      className="pointer-events-auto bg-background px-3 py-1.5 text-xs text-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      Download
                    </button>
                  </div>
                  {fav && (
                    <span className="absolute right-3 top-3 bg-foreground px-2 py-1 text-[10px] text-background">
                      ♥
                    </span>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </section>

      {/* Comments */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
          <span className="eyebrow text-muted-foreground">Notes for the studio</span>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl">Leave a note</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              setComments([{ author: gallery.client, text: comment, time: "Just now" }, ...comments]);
              setComment("");
            }}
            className="mt-8"
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share thoughts, favorites, or edits…"
              className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button type="submit" className="bg-foreground px-5 py-2.5 text-sm text-background">
                Post note
              </button>
            </div>
          </form>

          <ul className="mt-10 divide-y divide-hairline">
            {comments.map((c, i) => (
              <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 py-6">
                <div className="flex h-10 w-10 items-center justify-center border border-hairline font-display text-sm">
                  {c.author.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm">{c.author}</p>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-hairline py-10 text-center text-xs text-muted-foreground">
        Presented on <Link href="/" className="underline">LensBox</Link>
      </footer>

      {/* Lightbox */}
      {lightbox !== null && lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95 p-6"
          onClick={() => setLightbox(null)}
        >
          <Image
            src={lightboxPhoto.src}
            alt={lightboxPhoto.name}
            width={1600}
            height={1200}
            unoptimized
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-6 top-6 bg-background px-3 py-1.5 text-xs"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
