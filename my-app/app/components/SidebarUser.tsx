"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Self-contained client component that reads the current Supabase browser
 * session and renders the sidebar user chip (avatar initials + name + email)
 * plus a sign-out button that shows a confirmation modal before logging out.
 *
 * Uses createBrowserClient (from @supabase/ssr) which stores sessions in
 * cookies — so getSession() works reliably without any prop drilling.
 */
export function SidebarUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("··");
  const [showModal, setShowModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Portal requires the DOM — only render it after mount to avoid SSR mismatch.
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const user = session.user;

      // Name priority: full_name (set at signup) → OAuth name → email prefix
      const rawName: string =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ??
        "User";

      const displayName = rawName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const inits = displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      setName(displayName);
      setEmail(user.email ?? "");
      setInitials(inits);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* User chip + sign-out button */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-hairline font-display text-base">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{name || "Loading…"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>

        {/* Sign-out trigger */}
        <button
          id="sign-out-btn"
          onClick={() => setShowModal(true)}
          title="Sign out"
          aria-label="Sign out"
          className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {/* Arrow-right-from-bracket icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Logout confirmation modal — rendered via portal so it always sits
          above every stacking context, regardless of which page is active. */}
      {showModal && mounted && createPortal(
        <div
          id="logout-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ animation: "modalFadeIn 0.18s cubic-bezier(0.22,1,0.36,1) both" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-sm border border-hairline bg-background p-8 shadow-2xl"
            style={{ animation: "modalSlideUp 0.22s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {/* Icon */}
            <div className="mb-6 flex h-12 w-12 items-center justify-center border border-hairline text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <h2
              id="logout-modal-title"
              className="font-display mb-2 text-2xl leading-tight"
            >
              Sign out?
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">
              You'll be returned to the login screen. Any unsaved changes will be lost.
            </p>

            <div className="flex gap-3">
              {/* Yes — confirm logout */}
              <button
                id="logout-confirm-btn"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-80 disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <svg
                      className="animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Signing out…
                  </>
                ) : (
                  "Yes, sign out"
                )}
              </button>

              {/* No — dismiss */}
              <button
                id="logout-cancel-btn"
                onClick={() => setShowModal(false)}
                disabled={loggingOut}
                className="flex flex-1 items-center justify-center border border-foreground px-5 py-2.5 text-sm transition-colors hover:bg-foreground hover:text-background disabled:opacity-60"
              >
                No, stay
              </button>
            </div>
          </div>

          {/* Keyframe animations injected inline so no extra CSS file is needed */}
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes modalSlideUp {
              from { opacity: 0; transform: translateY(16px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}
