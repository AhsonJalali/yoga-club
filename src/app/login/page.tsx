import { redirect } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase";
import { currentMember } from "../../lib/session";
import { signInAction, registerAction } from "./actions";

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
      : error === "code"
      ? "Wrong club code."
      : error === "email"
      ? "That doesn't look like an email."
      : error === "invalid"
      ? "All fields are required."
      : error === "exists"
      ? "An account with that email already exists. Sign in instead."
      : error === "short"
      ? "Password must be at least 6 characters."
      : error === "server"
      ? "Server hiccup. Try again."
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <div className="fade-up w-full">
        <div className="mb-10 flex items-center gap-3">
          <span className="inline-block h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-xl shadow-rose-500/30" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/80">Welcome</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Yoga Club</h1>
          </div>
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
            Step on the mat.
          </span>
        </h2>
        <p className="mt-3 text-zinc-400">
          {isRegister
            ? "New here? Create your account in 30 seconds."
            : "Welcome back. Sign in to log today's session."}
        </p>

        {/* Tab toggle */}
        <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <Link
            href="/login"
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              !isRegister ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=register"
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              isRegister ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            Create account
          </Link>
        </div>

        {isRegister ? (
          <form
            action={registerAction}
            className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur"
          >
            <Field label="Your name" name="name" autoComplete="name" placeholder="Sara" />
            <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" />
            <Field label="Club code" name="code" type="password" autoComplete="off" placeholder="Ask the club" />

            {errMsg ? <p className="text-sm text-rose-400">{errMsg}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:shadow-rose-500/40 hover:brightness-110"
            >
              Create account
            </button>
            <p className="text-center text-[11px] text-zinc-500">
              No email verification — just a name, an email, and a password you&apos;ll remember.
            </p>
          </form>
        ) : (
          <form
            action={signInAction}
            className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur"
          >
            <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" autoComplete="current-password" placeholder="Your password" />

            {errMsg ? <p className="text-sm text-rose-400">{errMsg}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:shadow-rose-500/40 hover:brightness-110"
            >
              Sign in
            </button>
            <p className="text-center text-[11px] text-zinc-500">
              Forgot your password? Ask whoever runs the club to reset it for you.
            </p>
          </form>
        )}
      </div>
    </main>
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
