import type { Metadata } from "next";
import { AppShell, PrimaryButton, GhostButton } from "@/app/components/AppShell";

export const metadata: Metadata = {
  title: "Pricing — LensBox",
  description: "Simple plans for solo photographers and full studios.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    blurb: "Try LensBox with your next client gallery.",
    features: ["2 active galleries", "5 GB storage", "Password protection", "LensBox subdomain"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$19",
    blurb: "For working photographers shipping galleries every week.",
    features: [
      "Unlimited galleries",
      "500 GB storage",
      "Custom domain",
      "Client favorites & comments",
      "Download permissions",
      "Studio branding",
    ],
    cta: "Choose Pro",
    featured: true,
  },
  {
    name: "Studio",
    price: "$59",
    blurb: "For teams and agencies running many clients in parallel.",
    features: [
      "Everything in Pro",
      "5 TB storage",
      "Team seats & roles",
      "Client proofing & selections",
      "White-label exports",
      "Priority support",
    ],
    cta: "Talk to us",
  },
];

export default function PricingPage() {
  return (
    <AppShell
      eyebrow="Plans"
      title="Simple pricing. No noise."
      actions={<GhostButton href="mailto:hello@lensbox.app">Talk to sales</GhostButton>}
    >
      <p className="max-w-xl text-muted-foreground">
        Start free, upgrade to Pro when you ship more, move to Studio when your team does.
        Every plan keeps the same calm, editorial gallery experience for your clients.
      </p>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col border p-8 lg:p-10 ${
              t.featured ? "border-foreground" : "border-hairline"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{t.name}</h2>
              {t.featured && <span className="eyebrow">Most chosen</span>}
            </div>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-display text-5xl">{t.price}</span>
              {t.price !== "$0" && (
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
            <div className="mt-10">
              {t.featured ? (
                <PrimaryButton href="/galleries/new">{t.cta}</PrimaryButton>
              ) : (
                <GhostButton href="/galleries/new">{t.cta}</GhostButton>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-20 border-t border-hairline pt-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {[
            { q: "Can I switch plans later?", a: "Yes — upgrade, downgrade, or pause at any time. We prorate the difference." },
            { q: "Do clients need an account?", a: "Never. Clients open a private link, view, favorite, and download. That's it." },
            { q: "Do you handle large RAW deliveries?", a: "Yes. Pro and Studio plans support originals up to 200 MB per file." },
          ].map((f) => (
            <div key={f.q}>
              <p className="font-display text-lg">{f.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}