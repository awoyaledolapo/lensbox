"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { WordMark } from "@/app/components/WordMark";
import hero1 from "@/public/hero-1.jpg";
import hero3 from "@/public/hero-3.jpg";
import hero5 from "@/public/hero-5.jpg";

// ─────────────────────────────────────────────
// AuthLayout — two-column editorial split
// ─────────────────────────────────────────────

interface AuthLayoutProps {
  children: ReactNode;
  /** Heading shown on the left panel */
  heading: string;
  /** Supporting copy shown on the left panel */
  subheading: string;
  /** Small eyebrow label above the heading */
  eyebrow?: string;
}

export function AuthLayout({
  children,
  heading,
  subheading,
  eyebrow,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_520px]">
        {/* ── Left panel ── */}
        <aside className="relative hidden flex-col overflow-hidden border-r border-hairline lg:flex">
          {/* Background photography collage */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-px bg-hairline">
            <div className="relative row-span-2 overflow-hidden bg-muted">
              <Image src={hero1} alt="" fill className="object-cover" />
            </div>
            <div className="relative overflow-hidden bg-muted">
              <Image src={hero5} alt="" fill className="object-cover" />
            </div>
            <div className="relative overflow-hidden bg-muted">
              <Image src={hero3} alt="" fill className="object-cover" />
            </div>
            <div className="relative col-span-2 overflow-hidden bg-muted">
              <Image src={hero1} alt="" fill className="object-cover object-top" />
            </div>
          </div>

          {/* Dark scrim for readability */}
          <div className="absolute inset-0 bg-foreground/70" />

          {/* Content over the panel */}
          <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
            {/* Logo */}
            <div>
              <WordMark
                tagline="Client Galleries"
                href="/"
                size="md"
                variant="light"
              />
            </div>

            {/* Hero text */}
            <div>
              {eyebrow && (
                <p className="eyebrow mb-5 text-white/50">{eyebrow}</p>
              )}
              <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] leading-[1] tracking-tight text-white">
                {heading}
              </h1>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-white/60">
                {subheading}
              </p>
            </div>

            {/* Footer quote */}
            <div className="border-t border-white/15 pt-8">
              <blockquote className="text-sm leading-relaxed text-white/50 italic">
                "Your clients deserve a gallery as considered as the work inside it."
              </blockquote>
            </div>
          </div>
        </aside>

        {/* ── Right panel ── */}
        <main className="flex min-h-screen flex-col">
          {/* Mobile-only top bar */}
          <div className="flex items-center justify-between border-b border-hairline px-6 py-5 lg:hidden">
            <WordMark tagline="Client Galleries" href="/" size="sm" />
          </div>

          {/* Form area */}
          <div className="flex flex-1 items-center justify-center px-6 py-14 sm:px-10">
            <div className="w-full max-w-[420px]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AuthHeader — page title + switch link
// ─────────────────────────────────────────────

interface AuthHeaderProps {
  title: string;
  description?: string;
  switchText: string;
  switchLinkLabel: string;
  switchHref: string;
}

export function AuthHeader({
  title,
  description,
  switchText,
  switchLinkLabel,
  switchHref,
}: AuthHeaderProps) {
  return (
    <div className="mb-10">
      <h2 className="font-display text-4xl leading-[1.02] sm:text-5xl">{title}</h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <p className="mt-5 text-sm text-muted-foreground">
        {switchText}{" "}
        <Link
          href={switchHref}
          className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          {switchLinkLabel}
        </Link>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// AuthFormField — label + input + error message
// ─────────────────────────────────────────────

interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  /** Pass-through from React Hook Form register() */
  registration: React.InputHTMLAttributes<HTMLInputElement>;
}

export function AuthFormField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  error,
  disabled,
  registration,
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="eyebrow text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          "w-full border bg-background px-4 py-3 text-sm text-foreground",
          "placeholder:text-muted-foreground/60",
          "transition-colors focus:outline-none focus:ring-0",
          error
            ? "border-destructive focus:border-destructive"
            : "border-hairline focus:border-foreground",
          disabled ? "cursor-not-allowed opacity-50" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...registration}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// AuthSubmitButton
// ─────────────────────────────────────────────

interface AuthSubmitButtonProps {
  label: string;
  loadingLabel?: string;
  isLoading: boolean;
  disabled?: boolean;
}

export function AuthSubmitButton({
  label,
  loadingLabel = "Please wait…",
  isLoading,
  disabled,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={[
        "relative w-full bg-foreground px-6 py-3.5 text-sm text-background",
        "transition-opacity hover:opacity-90 focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2",
        isLoading || disabled ? "cursor-not-allowed opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={`transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}
        aria-hidden={isLoading}
      >
        {label}
      </span>
      {isLoading && (
        <span
          className="absolute inset-0 flex items-center justify-center gap-2"
          aria-live="polite"
        >
          {/* Minimal spinner using CSS animation */}
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>{loadingLabel}</span>
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// AuthAlert — inline server error / success banner
// ─────────────────────────────────────────────

interface AuthAlertProps {
  type: "error" | "success";
  message: string;
}

export function AuthAlert({ type, message }: AuthAlertProps) {
  const isError = type === "error";
  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "border px-4 py-3 text-sm leading-relaxed",
        isError
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-foreground/20 bg-foreground/5 text-foreground",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
