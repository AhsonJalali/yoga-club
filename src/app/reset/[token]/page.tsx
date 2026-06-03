import Link from "next/link";
import { ResetForm } from "./ResetForm";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <div className="fade-up w-full">
        <div className="mb-10 flex items-center gap-3">
          <span className="inline-block h-10 w-10 rounded-xl border border-line-strong bg-raised" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-clay">Reset</p>
            <h1 className="font-display text-2xl font-medium text-ink">Yoga Club</h1>
          </div>
        </div>

        <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          <span className="italic text-clay">
            Set a new password
          </span>
        </h2>
        <p className="mt-3 text-muted">
          Pick something at least 6 characters long. You&apos;ll be redirected to sign in once it&apos;s saved.
        </p>

        <ResetForm token={token} />

        <p className="mt-6 text-center text-sm text-faint">
          Link expired or not working?{" "}
          <Link href="/forgot" className="text-muted underline-offset-4 hover:text-ink hover:underline">
            Request a new one
          </Link>
        </p>
      </div>
    </main>
  );
}
