"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { signupSchema, type SignupFormValues } from "@/lib/auth/schemas";
import {
  AuthLayout,
  AuthHeader,
  AuthFormField,
  AuthSubmitButton,
  AuthAlert,
} from "@/app/components/auth/AuthComponents";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success" };

// ─── Signup Form ──────────────────────────────────────────────────────────────

function SignupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
  });

  const onSubmit = async (values: SignupFormValues) => {
    setStatus({ state: "loading" });

    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (error) {
        setStatus({ state: "error", message: error.message });
        return;
      }

      setStatus({ state: "success" });
    } catch {
      setStatus({
        state: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const isLoading = status.state === "loading";
  const isSuccess = status.state === "success";

  // ── Success screen ──
  if (isSuccess) {
    return (
      <div className="space-y-6 py-4">
        {/* Minimal checkmark */}
        <div className="flex h-12 w-12 items-center justify-center border border-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-2xl">Account created.</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to your email address. Open it to
            activate your account, then come back to sign in.
          </p>
        </div>
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          Go to sign in →
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Sign up form"
      className="space-y-5"
    >
      <AuthFormField
        id="fullName"
        label="Full name"
        type="text"
        placeholder="Maren Hollis"
        autoComplete="name"
        error={errors.fullName?.message}
        disabled={isLoading}
        registration={register("fullName")}
      />

      <AuthFormField
        id="email"
        label="Email"
        type="email"
        placeholder="you@studio.co"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isLoading}
        registration={register("email")}
      />

      <AuthFormField
        id="password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        disabled={isLoading}
        registration={register("password")}
      />

      <AuthFormField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        disabled={isLoading}
        registration={register("confirmPassword")}
      />

      {status.state === "error" && (
        <AuthAlert type="error" message={status.message} />
      )}

      <AuthSubmitButton
        label="Create account"
        loadingLabel="Creating account…"
        isLoading={isLoading}
      />

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account you agree to our{" "}
        <a
          href="/terms"
          className="underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  return (
    <AuthLayout
      eyebrow="Start for free"
      heading="A home for your best work."
      subheading="Create your LensBox account and deliver client galleries that feel as considered as your photography."
    >
      <AuthHeader
        title="Create account"
        description="Get started — no credit card required."
        switchText="Already have an account?"
        switchLinkLabel="Sign in →"
        switchHref="/login"
      />
      <SignupForm />
    </AuthLayout>
  );
}
