import type { Metadata } from "next";
import Image from "next/image";
import { WordMark } from "@/app/components/WordMark";
import { getAuthUser } from "@/lib/supabase/server";
import hero1 from "../public/hero-1.jpg";
import hero2 from "../public/hero-2.jpg";
import hero3 from "../public/hero-3.jpg";
import hero4 from "../public/hero-4.jpg";
import hero5 from "../public/hero-5.jpg";
import hero6 from "../public/hero-6.jpg";
import sc1 from "../public/showcase-1.jpg";
import sc2 from "../public/showcase-2.jpg";
import sc3 from "../public/showcase-3.jpg";
import sc4 from "../public/showcase-4.jpg";
import sc5 from "../public/showcase-5.jpg";
import sc6 from "../public/showcase-6.jpg";

export const metadata: Metadata = {
  title: "Gallery.io — A space for unforgettable work",
  description:
    "Gallery.io helps creators transform their projects into beautiful visual experiences.",
  openGraph: {
    title: "Gallery.io — A space for unforgettable work",
    description:
      "Gallery.io helps creators transform their projects into beautiful visual experiences.",
  },
};

const rowA = [hero1, hero2, hero3, hero4, hero5, hero6];
const rowB = [hero4, hero6, hero1, hero3, hero5, hero2];
const rowC = [hero2, hero5, hero6, hero4, hero1, hero3];

function MarqueeRow({
  images,
  reverse = false,
  heightClass,
}: {
  images: typeof rowA;
  reverse?: boolean;
  heightClass: string;
}) {
  const loop = [...images, ...images];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max gap-4 ${reverse ? "marquee-track-reverse" : "marquee-track"}`}
      >
        {loop.map((src, i) => (
          <div
            key={i}
            className={`${heightClass} aspect-[4/5] shrink-0 overflow-hidden bg-muted`}
          >
            <Image
              src={src}
              alt=""
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const collections = [
  { title: "Atelier Nº07", creator: "Maren Hollis", category: "Photography", img: hero5 },
  { title: "Camel Season", creator: "Studio Aalto", category: "Fashion", img: sc1 },
  { title: "Concrete Light", creator: "Jonas Vidal", category: "Architecture", img: hero2 },
  { title: "Soft Currents", creator: "Iris Lemaire", category: "Digital Art", img: hero4 },
  { title: "Object Study", creator: "Field Office", category: "Product Design", img: sc6 },
  { title: "Quiet Rooms", creator: "Noa Bergstrom", category: "Architecture", img: hero6 },
];

const tiers = [
  {
    name: "Starter",
    price: "Free",
    blurb: "For new creators putting together a first portfolio.",
    features: ["1 collection", "Up to 20 images", "Gallery.io subdomain", "Basic analytics"],
    cta: "Start free",
  },
  {
    name: "Creator",
    price: "$12",
    blurb: "For working creatives who ship projects regularly.",
    features: [
      "Unlimited collections",
      "Up to 2,000 images",
      "Custom domain",
      "Password-protected pages",
      "Advanced analytics",
    ],
    cta: "Try Creator",
    featured: true,
  },
  {
    name: "Studio",
    price: "$36",
    blurb: "For studios and brands managing many bodies of work.",
    features: [
      "Everything in Creator",
      "Team workspaces",
      "Client proofing",
      "White-label exports",
      "Priority support",
    ],
    cta: "Talk to us",
  },
];

export default async function Page() {
  // Server-side auth check — drives all smart CTAs on this page.
  const user = await getAuthUser();
  const isLoggedIn = !!user;

  // Navbar CTAs
  const navGhostLabel = isLoggedIn ? "My galleries" : "Open studio";
  const navGhostHref  = isLoggedIn ? "/galleries"  : "/login";
  const navCtaLabel   = isLoggedIn ? "Open studio"  : "Start free";
  const navCtaHref    = isLoggedIn ? "/galleries"   : "/signup";

  // Pricing section — Starter tier
  const starterCtaLabel = isLoggedIn ? "Open studio" : "Start free";
  const starterCtaHref  = isLoggedIn ? "/galleries"  : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
          <WordMark tagline="A space for creators" href="#top" size="md" />
          <ul className="hidden items-center gap-10 text-sm md:flex">
            <li><a href="#collections" className="hover:opacity-60 transition-opacity">Collections</a></li>
            <li><a href="#showcase" className="hover:opacity-60 transition-opacity">Showcase</a></li>
            <li><a href="#how" className="hover:opacity-60 transition-opacity">How it works</a></li>
            <li><a href="#pricing" className="hover:opacity-60 transition-opacity">Pricing</a></li>
          </ul>
          <div className="flex items-center gap-3">
            <a
              href={navGhostHref}
              className="hidden text-sm hover:opacity-60 sm:inline"
            >
              {navGhostLabel}
            </a>
            <a
              href={navCtaHref}
              className="border border-foreground px-4 py-2 text-sm transition-colors hover:bg-foreground hover:text-background"
            >
              {navCtaLabel}
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="border-b border-hairline pt-16 pb-10 lg:pt-24 lg:pb-16">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex items-center justify-between gap-6 pb-10">
            <span className="eyebrow text-muted-foreground">Gallery.io — Est. 2026</span>
            <span className="eyebrow hidden text-muted-foreground sm:block">Issue Nº 01 / Spring</span>
          </div>
          <h1 className="font-display rise-in mx-auto max-w-5xl text-center text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95] tracking-tight">
            Your work deserves a space
            <br className="hidden sm:block" /> that feels{" "}
            <em className="italic text-muted-foreground">unforgettable.</em>
          </h1>
          <p className="rise-in mx-auto mt-8 max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
            Gallery.io helps creators transform their projects into beautiful visual experiences.
          </p>
          <div className="rise-in mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#pricing"
              className="bg-foreground px-6 py-3 text-sm text-background transition-opacity hover:opacity-90"
            >
              Build your gallery
            </a>
            <a
              href="#showcase"
              className="border border-foreground px-6 py-3 text-sm transition-colors hover:bg-foreground hover:text-background"
            >
              See work
            </a>
          </div>
        </div>

        {/* Living portfolio rows */}
        <div className="mt-16 space-y-4 lg:mt-20">
          <MarqueeRow images={rowA} heightClass="h-44 sm:h-56 md:h-72" />
          <MarqueeRow images={rowB} reverse heightClass="h-52 sm:h-64 md:h-80" />
          <MarqueeRow images={rowC} heightClass="h-44 sm:h-56 md:h-72" />
        </div>
      </section>

      {/* Featured Collections */}
      <section id="collections" className="border-b border-hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pb-16 sm:flex sm:justify-between">
            <div className="min-w-0">
              <span className="eyebrow text-muted-foreground">Featured Collections</span>
              <h2 className="font-display mt-4 max-w-2xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                A library of work, organised by hand.
              </h2>
            </div>
            <a href="#showcase" className="shrink-0 text-sm underline-offset-4 hover:underline">
              View all →
            </a>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c, i) => (
              <article key={i} className="group cursor-pointer">
                <div className="relative overflow-hidden bg-muted">
                  <div className="aspect-[4/5] w-full">
                    <Image
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10" />
                </div>
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-2xl">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.creator}</p>
                  </div>
                  <span className="eyebrow shrink-0 text-muted-foreground">{c.category}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase / Masonry */}
      <section id="showcase" className="border-b border-hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="mb-16 max-w-3xl">
            <span className="eyebrow text-muted-foreground">Showcase — Spring Selection</span>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Editorial layouts that breathe like print.
            </h2>
            <p className="mt-6 max-w-xl text-muted-foreground">
              A composed masonry of contributions from photographers, designers, and studios using
              Gallery.io to publish their latest work.
            </p>
          </div>

          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {[
              { src: sc1, label: "01 — Camel Season", by: "Studio Aalto" },
              { src: sc2, label: "02 — Spiral", by: "Jonas Vidal" },
              { src: hero3, label: "03 — Object Nº4", by: "Field Office" },
              { src: sc4, label: "04 — Marble Form", by: "Hana Köhler" },
              { src: sc5, label: "05 — Valley at dawn", by: "Maren Hollis" },
              { src: hero5, label: "06 — Window Light", by: "Iris Lemaire" },
              { src: sc6, label: "07 — Sun Chair", by: "Field Office" },
              { src: hero2, label: "08 — Concrete", by: "Jonas Vidal" },
              { src: sc3, label: "09 — Still Life", by: "Noa Bergstrom" },
            ].map((item, i) => (
              <figure key={i} className="group mb-6 block break-inside-avoid">
                <div className="overflow-hidden bg-muted">
                  <Image
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>{item.label}</span>
                  <span className="italic">{item.by}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow text-muted-foreground">How it works</span>
              <h2 className="font-display mt-4 max-w-2xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Three steps from folder to portfolio.
              </h2>
            </div>
          </div>
          <ol className="grid grid-cols-1 gap-px overflow-hidden border border-hairline bg-hairline md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Upload your work",
                d: "Drag in raw files or import from your camera roll, Dropbox, or Drive. We preserve original quality.",
              },
              {
                n: "02",
                t: "Create collections",
                d: "Arrange images into editorial collections with custom titles, captions, and layouts.",
              },
              {
                n: "03",
                t: "Share your portfolio",
                d: "Publish to your own domain, send private links to clients, or keep collections quietly in draft.",
              },
            ].map((s) => (
              <li key={s.n} className="bg-background p-10 lg:p-12">
                <div className="font-display text-5xl text-muted-foreground">{s.n}</div>
                <h3 className="mt-10 text-lg font-medium">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-hairline py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="mb-16 max-w-3xl">
            <span className="eyebrow text-muted-foreground">Pricing</span>
            <h2 className="font-display mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Simple plans. No noise.
            </h2>
            <p className="mt-6 max-w-xl text-muted-foreground">
              Start free, grow into Creator when you ship more, move to Studio when your team does.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col border p-8 transition-colors lg:p-10 ${
                  t.featured ? "border-foreground" : "border-hairline"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl">{t.name}</h3>
                  {t.featured && <span className="eyebrow">Most chosen</span>}
                </div>
                <div className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-5xl">{t.price}</span>
                  {t.price !== "Free" && (
                    <span className="text-sm text-muted-foreground">/ month</span>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t.blurb}</p>
                <ul className="mt-8 space-y-3 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3 border-t border-hairline pt-3">
                      <span className="text-muted-foreground">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={t.name === "Starter" ? starterCtaHref : "#"}
                  className={`mt-10 inline-flex items-center justify-center px-6 py-3 text-sm transition-colors ${
                    t.featured
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  {t.name === "Starter" ? starterCtaLabel : t.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <a href="#top" className="font-display text-3xl">
                Gallery<span className="italic">.io</span>
              </a>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                A quiet home for visual work. Made for photographers, designers, and studios who
                care about the details.
              </p>
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Product</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li><a href="#collections" className="hover:opacity-60">Collections</a></li>
                <li><a href="#showcase" className="hover:opacity-60">Showcase</a></li>
                <li><a href="#pricing" className="hover:opacity-60">Pricing</a></li>
                <li><a href="#how" className="hover:opacity-60">How it works</a></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Company</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li><a href="#" className="hover:opacity-60">About</a></li>
                <li><a href="#" className="hover:opacity-60">Journal</a></li>
                <li><a href="#" className="hover:opacity-60">Contact</a></li>
                <li><a href="#" className="hover:opacity-60">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Social</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li><a href="#" className="hover:opacity-60">Instagram</a></li>
                <li><a href="#" className="hover:opacity-60">Are.na</a></li>
                <li><a href="#" className="hover:opacity-60">Twitter</a></li>
                <li><a href="#" className="hover:opacity-60">Dribbble</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-hairline pt-8 text-xs text-muted-foreground">
            <p>© 2026 Gallery.io — All rights reserved.</p>
            <p className="shrink-0">Built for creators, in plain black & white.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}