import { redirect } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase";
import { currentMember } from "../../lib/session";
import { AuthForm } from "../../components/AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");
  const me = await currentMember();
  if (me) redirect("/");

  const { error, mode } = await searchParams;
  const isRegister = mode === "register";

  const errMsg =
    error === "credentials"
      ? "Wrong email or password."
      : error === "email"
      ? "That doesn't look like an email."
      : error === "invalid"
      ? "All fields are required."
      : error === "exists"
      ? "An account with that email already exists. Sign in instead."
      : error === "short"
      ? "Password must be at least 6 characters."
      : error === "invite"
      ? "That invite code isn't right. Ask whoever runs the club for the current one."
      : error === "slow-down"
      ? "Too many attempts. Wait a few minutes and try again."
      : error === "server"
      ? "Server hiccup. Try again."
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <div className="fade-up w-full">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-raised text-coral">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1.6 2.4 1.6 5.2 0 7.6C10.4 8.2 10.4 5.4 12 3Z"/><path d="M5 13c2.8-.4 5.4.6 7 2.8-2.8.4-5.4-.6-7-2.8Z"/><path d="M19 13c-2.8-.4-5.4.6-7 2.8 2.8.4 5.4-.6 7-2.8Z"/><path d="M12 15.8V21"/></svg>
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-clay">Welcome</p>
            <h1 className="font-display text-2xl font-medium text-ink">Yoga Club</h1>
          </div>
        </div>

        <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Step on the <span className="italic text-clay">mat</span>.
        </h2>
        <p className="mt-3 text-muted">
          {isRegister
            ? "New here? Create your account in 30 seconds."
            : "Welcome back. Sign in to log today's session."}
        </p>

        {/* Tab toggle */}
        <div className="mt-6 inline-flex rounded-xl border border-line bg-raised p-1">
          <Link
            href="/login"
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              !isRegister ? "bg-surface text-ink shadow-sm" : "text-faint hover:text-ink"
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=register"
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              isRegister ? "bg-surface text-ink shadow-sm" : "text-faint hover:text-ink"
            }`}
          >
            Create account
          </Link>
        </div>

        <AuthForm mode={isRegister ? "register" : "signin"} initialError={errMsg} />

        {!isRegister ? (
          <p className="mt-5 text-center text-sm text-faint">
            <Link href="/forgot" className="underline-offset-4 transition hover:text-ink hover:underline">
              Forgot your password?
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
