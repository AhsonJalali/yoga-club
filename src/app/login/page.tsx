import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase";
import { currentMember } from "../../lib/session";
import { signInOrRegisterAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");
  const me = await currentMember();
  if (me) redirect("/");

  const { error } = await searchParams;
  const errMsg =
    error === "code"
      ? "Wrong club code."
      : error === "email"
      ? "That doesn't look like an email."
      : error === "invalid"
      ? "Email and name are required."
      : error === "server"
      ? "Server hiccup. Try again."
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="fade-up w-full">
        <div className="mb-10 flex items-center gap-3">
          <span className="inline-block h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-xl shadow-rose-500/30" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/80">Welcome</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Yoga Club</h1>
          </div>
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">Step on the mat.</span>
        </h2>
        <p className="mt-3 text-zinc-400">
          New here? We&apos;ll create your spot. Returning? Same email signs you back in.
        </p>

        <form action={signInOrRegisterAction} className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Your name</span>
            <input
              name="name"
              required
              autoComplete="name"
              placeholder="Sara"
              className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Club code</span>
            <input
              type="password"
              name="code"
              required
              autoComplete="off"
              placeholder="Ask the club"
              className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </label>

          {errMsg ? <p className="text-sm text-rose-400">{errMsg}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:shadow-rose-500/40 hover:brightness-110"
          >
            Step on the mat
          </button>
          <p className="text-center text-[11px] text-zinc-500">
            No password, no verification. Honor system all the way down.
          </p>
        </form>
      </div>
    </main>
  );
}
