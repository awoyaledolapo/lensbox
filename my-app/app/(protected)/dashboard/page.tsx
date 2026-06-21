import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, GhostButton, PrimaryButton } from "@/app/components/AppShell";
import { getAuthUser } from "@/lib/supabase/server";
import { getUserGalleries } from "@/lib/services/gallery.service";
import type { Gallery } from "@/lib/types/gallery";

export const metadata: Metadata = {
  title: "Dashboard — LensBox",
  description: "Your client galleries, uploads, and storage at a glance.",
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-hairline p-6 lg:p-8">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="font-display mt-4 text-4xl lg:text-5xl">{value}</p>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Gallery placeholder card (no cover image yet) ────────────────────────────

function GalleryPlaceholder({ title }: { title: string }) {
  const initials = title
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="flex aspect-[4/5] items-center justify-center bg-muted transition-transform duration-700 ease-out group-hover:scale-[1.04]">
      <span className="font-display text-6xl text-muted-foreground/30 select-none">{initials}</span>
    </div>
  );
}

/** Format a relative date for gallery cards. */
function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ─── Recent gallery cards ─────────────────────────────────────────────────────

function RecentGalleryCard({ gallery }: { gallery: Gallery }) {
  return (
    <Link href={`/galleries/${gallery.id}`} className="group block">
      <div className="relative overflow-hidden bg-muted">
        <GalleryPlaceholder title={gallery.title} />
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
        <div className="min-w-0">
          <h3 className="font-display truncate text-2xl">{gallery.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {gallery.client_name ?? "No client"}
          </p>
        </div>
        <span className="eyebrow shrink-0 text-muted-foreground">
          {relativeDate(gallery.created_at)}
        </span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // Fetch user and galleries in parallel
  const [user, galleries] = await Promise.all([getAuthUser(), getUserGalleries()]);

  // Derive display name: full_name → OAuth name → email prefix → fallback
  const rawName: string =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const displayName = rawName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Time-aware greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  // Show the 3 most recent galleries (already ordered newest-first by service)
  const recentGalleries = galleries.slice(0, 3);

  return (
    <AppShell
      eyebrow="Studio — Spring 2026"
      title={`Good ${timeOfDay}, ${displayName}.`}
      actions={
        <>
          <GhostButton href="/galleries">All galleries</GhostButton>
          <PrimaryButton href="/galleries/new">New gallery</PrimaryButton>
        </>
      }
    >
      {/* Stats */}
      <section className="grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-background">
          <StatCard
            label="Your galleries"
            value={String(galleries.length)}
            sub={galleries.length === 0 ? "Create your first one" : `${galleries.length} total`}
          />
        </div>
        <div className="bg-background">
          <StatCard
            label="This week's uploads"
            value="0"
            sub="Upload photos to a gallery"
          />
        </div>
        <div className="bg-background">
          <StatCard label="Client views" value="0" sub="Share a gallery to get views" />
        </div>
        <div className="bg-background">
          <StatCard label="Favorited photos" value="0" sub="Clients haven't favorited yet" />
        </div>
      </section>

      {/* Storage + quick actions */}
      <section className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="border border-hairline p-8 lg:col-span-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-muted-foreground">Storage</p>
              <p className="font-display mt-3 text-4xl">
                182.4 GB <span className="text-muted-foreground text-2xl">/ 500 GB</span>
              </p>
            </div>
            <span className="text-sm text-muted-foreground">36% used</span>
          </div>
          <div className="mt-8 h-px w-full bg-hairline">
            <div className="h-px bg-foreground" style={{ width: "36%" }} />
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-hairline pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Photos</dt>
              <dd className="mt-2 font-display text-2xl">141 GB</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Video previews</dt>
              <dd className="mt-2 font-display text-2xl">36 GB</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Archive</dt>
              <dd className="mt-2 font-display text-2xl">5.4 GB</dd>
            </div>
          </dl>
        </div>

        <div className="border border-hairline p-8">
          <p className="eyebrow text-muted-foreground">Quick actions</p>
          <ul className="mt-6 divide-y divide-hairline">
            {[
              { to: "/galleries/new", label: "Create a new gallery" },
              { to: "/galleries", label: "Browse all galleries" },
              { to: "/settings", label: "Update studio branding" },
              { to: "/pricing", label: "Compare plans" },
            ].map((q) => (
              <li key={q.to}>
                <Link
                  href={q.to}
                  className="flex items-center justify-between py-4 text-sm hover:opacity-60"
                >
                  <span>{q.label}</span>
                  <span>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent galleries — real data from Supabase */}
      <section className="mt-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="eyebrow text-muted-foreground">Your galleries</span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">
              {recentGalleries.length > 0 ? "Recently created." : "Nothing here yet."}
            </h2>
          </div>
          {galleries.length > 3 && (
            <Link href="/galleries" className="text-sm underline-offset-4 hover:underline">
              View all →
            </Link>
          )}
        </div>

        {recentGalleries.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {recentGalleries.map((g) => (
              <RecentGalleryCard key={g.id} gallery={g} />
            ))}
          </div>
        ) : (
          <div className="border border-hairline py-24 text-center">
            <p className="text-sm text-muted-foreground">
              No galleries yet.{" "}
              <Link href="/galleries/new" className="underline underline-offset-4 hover:opacity-70">
                Create your first one →
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Recent uploads — empty state until photo upload is wired */}
      <section className="mt-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="eyebrow text-muted-foreground">Recent uploads</span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">Nothing here yet.</h2>
          </div>
        </div>
        <div className="border border-hairline py-20 text-center">
          <p className="font-display text-2xl">No uploads yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open a gallery and add your first photos to see them here.
          </p>
          {galleries.length > 0 ? (
            <Link
              href={`/galleries/${galleries[0].id}`}
              className="mt-6 inline-flex items-center justify-center bg-foreground px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90"
            >
              Go to your latest gallery →
            </Link>
          ) : (
            <Link
              href="/galleries/new"
              className="mt-6 inline-flex items-center justify-center bg-foreground px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90"
            >
              Create a gallery first →
            </Link>
          )}
        </div>
      </section>
    </AppShell>
  );
}