"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, DollarSign, Users, Loader2, Check } from "lucide-react";

export function JoinChallengeCard({
  challengeId,
  challengeName,
  windowLabel,
  scheduleLabel,
  penalty,
  joinByLabel,
  memberCount,
}: {
  challengeId: string;
  challengeName: string;
  windowLabel: string;
  scheduleLabel: string;
  penalty: number;
  joinByLabel: string | null;
  memberCount: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "joining" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setState("joining");
    setError(null);
    try {
      const res = await fetch("/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.reason || "join-failed");
      setState("done");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-8 sm:p-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl border border-coral/30 bg-coral/10">
          <CalendarDays className="h-6 w-6 text-coral" />
        </div>
        <h2 className="font-display mt-5 text-2xl font-medium text-ink sm:text-3xl">
          You&apos;re not in the {challengeName} challenge yet
        </h2>
        <p className="mt-3 text-base text-muted">
          Opt in to join {memberCount} {memberCount === 1 ? "person" : "people"} already committed. Skip it with no penalty — but once you&apos;re in, missed sessions count.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Fact icon={<CalendarDays className="h-4 w-4" />} label={windowLabel} sub={scheduleLabel} />
          <Fact icon={<DollarSign className="h-4 w-4" />} label={`$${penalty}/miss`} sub="settled on Venmo" />
          <Fact icon={<Users className="h-4 w-4" />} label={`${memberCount} in`} sub={joinByLabel ? `join by ${joinByLabel}` : "open to join"} />
        </div>

        <button
          type="button"
          onClick={join}
          disabled={state === "joining" || state === "done"}
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-coral px-6 py-3 text-sm font-semibold text-ground transition hover:bg-coral-deep disabled:opacity-70"
        >
          {state === "joining" ? (<><Loader2 className="h-4 w-4 animate-spin" /> Joining…</>) : state === "done" ? (<><Check className="h-4 w-4" /> You&apos;re in!</>) : (<>Join the {challengeName} challenge</>)}
        </button>
        {error ? <p className="mt-3 text-xs text-coral-deep">Couldn&apos;t join: {error}</p> : null}
      </div>
    </div>
  );
}

function Fact({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-line bg-raised px-3 py-3">
      <span className="text-clay">{icon}</span>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="text-[11px] text-faint">{sub}</span>
    </div>
  );
}
