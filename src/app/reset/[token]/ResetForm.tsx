"use client";

import { useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please fill in both password fields.",
  mismatch: "Those passwords don't match.",
  short: "Password must be at least 6 characters.",
  token: "That reset link is invalid or has already been used.",
  expired: "That reset link has expired. Request a new one.",
  server: "Server hiccup. Try again.",
  network: "Network error. Try again.",
};

/**
 * New-password form for the reset flow. Submits via fetch (mirrors AuthForm's
 * pattern for the React 19 / Next 16 form-action workaround) and navigates to
 * /login?reset=1 on success so the login page can show a confirmation toast.
 */
export function ResetForm({ token }: { token: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (!password || !confirm) {
      setError(ERROR_MESSAGES.invalid);
      return;
    }
    if (password !== confirm) {
      setError(ERROR_MESSAGES.mismatch);
      return;
    }
    if (password.length < 6) {
      setError(ERROR_MESSAGES.short);
      return;
    }

    // Strip the confirm field — the API only wants token + password.
    fd.delete("confirm");
    fd.set("token", token);

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      if (res.ok) {
        window.location.assign("/login?reset=1");
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      const code = body?.error ?? "server";
      setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.server);
    } catch (err) {
      console.error("[reset] submit failed:", err);
      setError(ERROR_MESSAGES.network);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      method="POST"
      className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6"
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">New password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className="mt-2 block w-full rounded-xl border border-line bg-raised px-3 py-2.5 text-ink placeholder:text-faint focus:border-coral/50 focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Confirm password</span>
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Type it again"
          className="mt-2 block w-full rounded-xl border border-line bg-raised px-3 py-2.5 text-ink placeholder:text-faint focus:border-coral/50 focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </label>

      {error ? <p className="text-sm text-coral-deep">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-ground transition hover:bg-coral-deep disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
