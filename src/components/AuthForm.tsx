"use client";

import { useState } from "react";

type Mode = "signin" | "register";

type Props = {
  mode: Mode;
  initialError?: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Wrong email or password.",
  email: "That doesn't look like an email.",
  invalid: "All fields are required.",
  exists: "An account with that email already exists. Sign in instead.",
  short: "Password must be at least 6 characters.",
  server: "Server hiccup. Try again.",
  network: "Network error. Try again.",
};

/**
 * Client-side auth form. Submits via explicit fetch() and navigates with
 * window.location to bypass React 19 / Next 16 form-action interception
 * that was eating the Set-Cookie header on the live deploy.
 */
export function AuthForm({ mode, initialError }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/signin";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
        // Include cookies so the Set-Cookie issued by the route handler sticks
        // to this origin and is sent with subsequent requests.
        credentials: "same-origin",
        // Follow the 303 ourselves — the browser DOES apply the Set-Cookie from
        // the redirect response before fetching the Location URL, which means
        // by the time we inspect res.url the cookie is already in the jar.
        redirect: "follow",
      });

      const finalUrl = new URL(res.url);
      const err = finalUrl.searchParams.get("error");

      // Success path: the route handler redirects to "/" on auth success. Any
      // other final URL (typically /login?error=…) means auth failed.
      if (finalUrl.pathname === "/" && !err) {
        // Hard navigation guarantees a fresh server render that uses the
        // new cookie. router.push would skip the cookie since the RSC payload
        // for "/" is what we just received without auth context.
        window.location.assign("/");
        return;
      }

      setError(err && ERROR_MESSAGES[err] ? ERROR_MESSAGES[err] : ERROR_MESSAGES.server);
    } catch (err) {
      console.error("[auth] submit failed:", err);
      setError(ERROR_MESSAGES.network);
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "register") {
    return (
      <form
        onSubmit={onSubmit}
        method="POST"
        className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur"
      >
        <Field label="Your name" name="name" autoComplete="name" placeholder="Sara" />
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:shadow-rose-500/40 hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-[11px] text-zinc-500">
          No email verification — just a name, an email, and a password you&apos;ll remember.
        </p>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      method="POST"
      className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur"
    >
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
      />

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:shadow-rose-500/40 hover:brightness-110 disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-[11px] text-zinc-500">
        Forgot your password? Ask whoever runs the club to reset it for you.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
      />
    </label>
  );
}
