"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "@/lib/auth/schemas";
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

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setStatus({ state: "loading" });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setStatus({ state: "error", message: error.message });
        return;
      }

      setStatus({ state: "success" });

      // Honour the ?redirectTo= param set by middleware when the user was
      // bounced here from a protected route. Fall back to /dashboard.
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

      // Hard-navigate instead of router.push() — router.refresh() is not
      // awaitable, so a SPA push still races against the session update.
      // window.location.href sends a fresh HTTP request with the updated
      // Supabase cookie attached, so the middleware sees the session and
      // does NOT redirect us back to /login.
      window.location.href = redirectTo;
    } catch {
      setStatus({
        state: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const isLoading = status.state === "loading";
  const isSuccess = status.state === "success";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Login form"
      className="space-y-5"
    >
      <AuthFormField
        id="email"
        label="Email"
        type="email"
        placeholder="you@studio.co"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isLoading || isSuccess}
        registration={register("email")}
      />

      <AuthFormField
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isLoading || isSuccess}
        registration={register("password")}
      />

      <div className="flex justify-end">
        <a
          href="#"
          className="text-xs text-muted-foreground underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          Forgot password?
        </a>
      </div>

      {status.state === "error" && (
        <AuthAlert type="error" message={status.message} />
      )}

      {status.state === "success" && (
        <AuthAlert type="success" message="Signed in — redirecting to your studio…" />
      )}

      <AuthSubmitButton
        label="Sign in"
        loadingLabel="Signing in…"
        isLoading={isLoading}
        disabled={isSuccess}
      />
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      heading="Your studio awaits."
      subheading="Sign in to access your galleries, client deliveries, and studio settings."
    >
      <AuthHeader
        title="Sign in"
        description="Enter your credentials to continue."
        switchText="New to LensBox?"
        switchLinkLabel="Create an account →"
        switchHref="/signup"
      />
      <LoginForm />
    </AuthLayout>
  );
}
