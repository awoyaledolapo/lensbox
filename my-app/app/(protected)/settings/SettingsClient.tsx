"use client";

import type { ReactNode } from "react";
import { useState } from "react";

// ─── Shared sub-components ────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-hairline py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-6 border-t border-hairline py-4">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative h-7 w-12 border transition-colors ${
          value ? "border-foreground bg-foreground" : "border-hairline bg-background"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 transition-transform ${
            value ? "translate-x-6 bg-background" : "translate-x-0.5 bg-foreground"
          }`}
        />
      </button>
    </label>
  );
}

// ─── Settings sections ────────────────────────────────────────────────────────

const sections = [
  { id: "profile", label: "Profile" },
  { id: "branding", label: "Branding" },
  { id: "notifications", label: "Notifications" },
];

// ─── Main client component ────────────────────────────────────────────────────

/**
 * Interactive settings UI. Receives real user data from the parent Server
 * Component and uses them as default values for the profile fields.
 */
export function SettingsClient({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [active, setActive] = useState("profile");
  const [notifs, setNotifs] = useState({
    favorites: true,
    comments: true,
    downloads: false,
    weekly: true,
  });

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Section nav */}
      <nav>
        <ul className="space-y-px">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setActive(s.id)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  active === s.id ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                <span>{s.label}</span>
                {active === s.id && <span>●</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Section content */}
      <div>
        {active === "profile" && (
          <section>
            <h2 className="font-display text-3xl">Profile</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              How your studio appears across LensBox.
            </p>

            {/* Studio name pre-filled with real user's display name */}
            <Field label="Studio name" hint="Shown on every client gallery.">
              <input
                key={defaultName}
                defaultValue={defaultName}
                className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </Field>

            {/* Contact email pre-filled with real user's email */}
            <Field label="Contact email">
              <input
                key={defaultEmail}
                defaultValue={defaultEmail}
                type="email"
                className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </Field>

            <Field label="Website">
              <input
                defaultValue=""
                placeholder="https://yourstudio.co"
                className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </Field>

            <Field label="Bio" hint="A short note shown on the client gallery footer.">
              <textarea
                rows={4}
                defaultValue=""
                placeholder="A few words about your studio…"
                className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </Field>

            {/* Save button inline with the profile section */}
            <div className="border-t border-hairline pt-6">
              <button
                type="button"
                className="inline-flex items-center justify-center bg-foreground px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90"
              >
                Save changes
              </button>
            </div>
          </section>
        )}

        {active === "branding" && (
          <section>
            <h2 className="font-display text-3xl">Branding</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Style every gallery in your studio&apos;s voice.
            </p>
            <Field label="Logo" hint="SVG or PNG with transparent background.">
              <label className="flex aspect-[3/1] cursor-pointer items-center justify-center border border-dashed border-foreground/30 bg-muted/40 px-6 text-center text-sm text-muted-foreground transition-colors hover:border-foreground hover:bg-muted">
                Drop logo here, or click to browse
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </Field>
            <Field label="Display font">
              <select className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none">
                <option>Instrument Serif</option>
                <option>Inter Display</option>
                <option>Söhne</option>
                <option>GT Sectra</option>
              </select>
            </Field>
            <Field label="Accent" hint="Used for buttons and highlights inside client galleries.">
              <div className="flex gap-3">
                {["#111111", "#3A3A3A", "#5C4A36", "#1F3A2E", "#3B3B59"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{ background: c }}
                    className="h-9 w-9 border border-hairline"
                    aria-label={c}
                  />
                ))}
              </div>
            </Field>
            <Field label="Custom domain">
              <input
                defaultValue=""
                placeholder="galleries.yourstudio.co"
                className="w-full border border-hairline bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              />
            </Field>
          </section>
        )}

        {active === "notifications" && (
          <section>
            <h2 className="font-display text-3xl">Notifications</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose what reaches your inbox.
            </p>
            <div className="mt-8">
              <Toggle
                label="Email me when a client favorites a photo"
                value={notifs.favorites}
                onChange={(v) => setNotifs({ ...notifs, favorites: v })}
              />
              <Toggle
                label="Email me when a client leaves a comment"
                value={notifs.comments}
                onChange={(v) => setNotifs({ ...notifs, comments: v })}
              />
              <Toggle
                label="Email me when a client downloads photos"
                value={notifs.downloads}
                onChange={(v) => setNotifs({ ...notifs, downloads: v })}
              />
              <Toggle
                label="Send a weekly studio summary"
                value={notifs.weekly}
                onChange={(v) => setNotifs({ ...notifs, weekly: v })}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
