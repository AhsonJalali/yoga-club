"use client";

import { useState } from "react";

/**
 * Forgot-password email form. Same fetch-based submit pattern as AuthForm
 * (avoids the React 19 / Next 16 form-action interception). Always shows the
 * same confirmation regardless of whether the email exists, so we don't leak
 * which addresses are registered.
 */
export function ForgotForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      if (!res.ok) {
        setError("Server hiccup. Try again.");
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("[forgot] submit failed:", err);
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm text-ink">
          If an account exists for that email, a reset link is on the way. Check your inbox (and spam folder).
        </p>
        <p className="mt-3 text-xs text-faint">The link expires in 1 hour.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      method="POST"
      className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6"
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 block w-full rounded-xl border border-line bg-raised px-3 py-2.5 text-ink placeholder:text-faint focus:border-coral/50 focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </label>

      {error ? <p className="text-sm text-coral-deep">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-ground transition hover:bg-coral-deep disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
