import { redirect } from "next/navigation";
import { supabase, isSupabaseConfigured, Member } from "../../lib/supabase";
import { currentMember } from "../../lib/session";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/");
  const me = await currentMember();
  if (me) redirect("/");

  const { data: members } = await supabase()
    .from("members")
    .select("*")
    .order("name", { ascending: true });

  const { error } = await searchParams;

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
          Pick your name and enter the club code. We&apos;re building a habit together.
        </p>

        <form action={loginAction} className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Who are you?</span>
            <select
              name="memberId"
              required
              defaultValue=""
              className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="" disabled>Select your name</option>
              {(members ?? []).map((m: Member) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Club code</span>
            <input
              type="password"
              name="code"
              required
              autoComplete="off"
              className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </label>

          {error ? (
            <p className="text-sm text-rose-400">
              {error === "code" ? "Wrong club code." : "Couldn't sign in. Try again."}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-rose-500/20 transition hover:shadow-rose-500/40 hover:brightness-110"
          >
            Step on the mat
          </button>
        </form>

        {(members ?? []).length === 0 ? (
          <p className="mt-6 text-sm text-amber-300">
            No members yet. Add yourself in the Supabase <code>members</code> table to get started.
          </p>
        ) : null}
      </div>
    </main>
  );
}
