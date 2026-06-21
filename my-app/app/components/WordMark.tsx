"use client";

import Link from "next/link";

/**
 * Reusable LensBox word-mark.
 *
 * Props
 *  - tagline  : text shown beneath the brand name  (default: "Studio Workspace")
 *  - href     : where the logo links to             (default: "/")
 *  - size     : "sm" | "md" | "lg"                  (default: "md")
 *  - asSpan   : render a <span> instead of <Link>   (default: false)
 *  - variant  : "default" (dark on light) | "light" (white on dark)
 */
export function WordMark({
  tagline = "Studio Workspace",
  href = "/",
  size = "md",
  asSpan = false,
  variant = "default",
}: {
  tagline?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  asSpan?: boolean;
  variant?: "default" | "light";
}) {
  const brandSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  const tagSize = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]",
  }[size];

  const brandColor =
    variant === "light" ? "text-white" : "text-foreground";
  const tagColor =
    variant === "light" ? "text-white/50" : "text-muted-foreground";

  const inner = (
    <span className="inline-flex flex-col leading-none">
      {/* Brand name */}
      <span className={`font-display tracking-tight ${brandSize} ${brandColor}`}>
        Lens<span className="italic">Box</span>
      </span>
      {/* Tagline — sits right beneath, like ™ */}
      <span
        className={`mt-[3px] font-sans font-normal tracking-[0.18em] uppercase ${tagSize} ${tagColor}`}
      >
        {tagline}
      </span>
    </span>
  );

  if (asSpan) return inner;

  return (
    <Link href={href} className="inline-flex focus:outline-none">
      {inner}
    </Link>
  );
}
