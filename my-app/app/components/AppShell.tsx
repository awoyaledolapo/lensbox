"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { WordMark } from "@/app/components/WordMark";
import { SidebarUser } from "@/app/components/SidebarUser";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/galleries", label: "Galleries" },
  { to: "/galleries/new", label: "New gallery" },
  { to: "/pricing", label: "Pricing" },
  { to: "/settings", label: "Settings" },
];

export function AppShell({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="border-b border-hairline lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="px-8 pt-8 pb-10">
              <WordMark tagline="Studio Workspace" href="/" size="md" />
            </div>
            <nav className="px-4">
              <ul className="space-y-px">
                {nav.map((n) => {
                  const active =
                    n.to === "/galleries"
                      ? pathname === "/galleries"
                      : pathname.startsWith(n.to);
                  return (
                    <li key={n.to}>
                      <Link
                        href={n.to}
                        className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                          active
                            ? "bg-foreground text-background"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{n.label}</span>
                        {active && <span className="text-xs">●</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-auto border-t border-hairline px-8 py-6">
              <SidebarUser />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <header className="border-b border-hairline">
            <div className="flex flex-col gap-6 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0">
                  {eyebrow && (
                    <span className="eyebrow text-muted-foreground">{eyebrow}</span>
                  )}
                  <h1 className="font-display mt-3 text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
                    {title}
                  </h1>
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
              </div>
            </div>
          </header>
          <div className="px-6 py-12 sm:px-10 lg:px-14 lg:py-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  href,
  type,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const cls =
    "inline-flex items-center justify-center bg-foreground px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90";
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type ?? "button"} onClick={onClick} className={cls}>{children}</button>;
}

export function GhostButton({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "inline-flex items-center justify-center border border-foreground px-5 py-2.5 text-sm transition-colors hover:bg-foreground hover:text-background";
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}