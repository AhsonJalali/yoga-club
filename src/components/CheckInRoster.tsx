"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CheckCircle2, XCircle, ExternalLink, Sparkles, Sunrise, Waves, Leaf, Moon, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { Member, CheckInStatus } from "../lib/supabase";
import { PENALTY_USD, venmoUrl, dayTheme, DayTheme } from "../lib/schedule";
import { setStatusAction } from "../app/actions";

type Props = {
  members: Member[];
  meId: string;
  sessionDate: string;
  initialStatusByMember: Record<string, CheckInStatus | undefined>;
  isRequiredDay: boolean;
};



type Action =
  | { type: "set"; memberId: string; status: CheckInStatus }
  | { type: "clear"; memberId: string };

export function CheckInRoster({ members, meId, sessionDate, initialStatusByMember, isRequiredDay }: Props) {
  const [, startTransition] = useTransition();
  const [showVenmoModal, setShowVenmoModal] = useState(false);
  const [optimistic, applyOptimistic] = useOptimistic<
    Record<string, CheckInStatus | undefined>,
    Action
  >(initialStatusByMember, (state, action) => {
    if (action.type === "clear") {
      const next = { ...state };
      delete next[action.memberId];
      return next;
    }
    return { ...state, [action.memberId]: action.status };
  });

  const onMark = (status: "done" | "skipped" | "clear") => {
    if (status === "skipped" && isRequiredDay) {
      setShowVenmoModal(true);
    }
    startTransition(async () => {
      if (status === "clear") applyOptimistic({ type: "clear", memberId: meId });
      else applyOptimistic({ type: "set", memberId: meId, status });
      await setStatusAction(sessionDate, status);
    });
  };

  const myStatus = optimistic[meId];
  const theme = dayTheme(parseLocalDate(sessionDate));

  return (
    <section className="fade-up-3 mt-12">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-white">
            Your check-in
          </h3>
          <p className="text-sm text-zinc-500">
            {isRequiredDay
              ? "Honor system. Be honest — both answers update the leaderboard."
              : "No required session today. Bonus credit if you practiced anyway."}
          </p>
        </div>
        <DayThemeTag theme={theme} />
      </div>

      {/* My big interactive card */}
      <MyCard
        name={members.find((m) => m.id === meId)?.name ?? "You"}
        status={myStatus}
        onMark={onMark}
        isRequiredDay={isRequiredDay}
        showVenmoOnSkip={isRequiredDay}
      />

      {showVenmoModal ? (
        <VenmoModal onClose={() => setShowVenmoModal(false)} />
      ) : null}

      {/* Other members — read-only */}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {members
          .filter((m) => m.id !== meId)
          .map((m) => {
            const status = optimistic[m.id];
            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                  status === "done"
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : status === "skipped"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-white/10 bg-zinc-950/60"
                }`}
              >
                <Avatar name={m.name} size={36} ring={status === "done" ? "ok" : status === "skipped" ? "miss" : null} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{m.name}</p>
                  <p className={`text-[11px] ${
                    status === "done" ? "text-emerald-300" : status === "skipped" ? "text-rose-300" : "text-zinc-500"
                  }`}>
                    {status === "done" ? "Done" : status === "skipped" ? "Missed" : "—"}
                  </p>
                </div>
              </li>
            );
          })}
      </ul>
    </section>
  );
}

function MyCard({
  name,
  status,
  onMark,
  isRequiredDay,
  showVenmoOnSkip,
}: {
  name: string;
  status: CheckInStatus | undefined;
  onMark: (status: "done" | "skipped" | "clear") => void;
  isRequiredDay: boolean;
  showVenmoOnSkip: boolean;
}) {
  const firstName = name.split(" ")[0];

  if (status === "done") {
    return (
      <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-6 shadow-lg shadow-emerald-500/10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar name={name} size={72} ring="ok" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-300">Logged · Done</p>
            <h4 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Yes, {firstName} — solid work today.
            </h4>
            <p className="mt-1 text-sm text-zinc-400">Counts toward your streak. See you next session.</p>
          </div>
          <button
            type="button"
            onClick={() => onMark("clear")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10"
          >
            Undo
          </button>
        </div>
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div className="mt-6 overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent p-6 shadow-lg shadow-rose-500/10">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <Avatar name={name} size={72} ring="miss" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-rose-300">Logged · Skipped</p>
            <h4 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {showVenmoOnSkip
                ? <>That&apos;s ${PENALTY_USD} into the pot, {firstName}.</>
                : <>Honest log — see you next session, {firstName}.</>}
            </h4>
            <p className="mt-1 text-sm text-zinc-400">
              {showVenmoOnSkip
                ? "No big deal — happens. Square it now and start fresh."
                : "No penalty today. Rest is part of the work."}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            {showVenmoOnSkip ? (
              <a
                href={venmoUrl(PENALTY_USD, "Yoga Club — missed session")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-rose-500/30 transition hover:brightness-110"
              >
                Venmo ${PENALTY_USD}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onMark("clear")}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10"
            >
              Undo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Undecided
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <Avatar name={name} size={72} ring={null} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-300/80">
            <Sparkles className="mr-1 inline-block h-3 w-3" />
            Your turn, {firstName}
          </p>
          <h4 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {isRequiredDay ? "Did you do today's session?" : "Did you practice today?"}
          </h4>
          <p className="mt-1 text-sm text-zinc-400">
            {isRequiredDay
              ? "Honest yes or no — both update the leaderboard."
              : "Yes counts as bonus credit. No is just an honest log — no penalty."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => onMark("done")}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:scale-[1.03] hover:shadow-emerald-500/50 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            Yes, I did it
          </button>
          <button
            type="button"
            onClick={() => onMark("skipped")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 active:scale-95"
          >
            <XCircle className="h-4 w-4" />
            No, I didn&apos;t
          </button>
        </div>
      </div>
    </div>
  );
}

function DayThemeTag({ theme }: { theme: DayTheme }) {
  const Icon = theme.emoji === "sunrise" ? Sunrise : theme.emoji === "wave" ? Waves : theme.emoji === "leaf" ? Leaf : Moon;
  const color =
    theme.emoji === "sunrise"
      ? "from-amber-400/30 to-orange-500/20 text-amber-200 border-amber-400/30"
      : theme.emoji === "wave"
      ? "from-sky-400/30 to-cyan-500/20 text-sky-200 border-sky-400/30"
      : theme.emoji === "leaf"
      ? "from-emerald-400/30 to-teal-500/20 text-emerald-200 border-emerald-400/30"
      : "from-violet-400/20 to-indigo-500/20 text-violet-200 border-violet-400/30";
  return (
    <div className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-br ${color} px-4 py-2.5`}>
      <Icon className="h-5 w-5" />
      <div className="text-right">
        <p className="text-sm font-semibold leading-tight">{theme.label}</p>
        <p className="text-[11px] leading-tight opacity-80">{theme.sub}</p>
      </div>
    </div>
  );
}

function VenmoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/40 bg-gradient-to-br from-zinc-950 via-rose-950/40 to-zinc-950 p-8 shadow-2xl shadow-rose-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow blob */}
        <div className="pointer-events-none absolute -top-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 opacity-30 blur-3xl" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative text-center">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-4xl font-black text-black shadow-xl shadow-rose-500/40">
            $50
          </div>
          <h3 className="mt-6 text-3xl font-bold tracking-tight text-white">
            You gotta pay!
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            That&apos;s ${PENALTY_USD} into the pot. Square it now and start fresh next session — no shame.
          </p>

          <a
            href={venmoUrl(PENALTY_USD, "Yoga Club — missed session")}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-5 py-3.5 text-base font-bold text-black shadow-lg shadow-rose-500/40 transition hover:scale-[1.02] hover:brightness-110 active:scale-95"
          >
            Venmo ${PENALTY_USD} now
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs text-zinc-500 transition hover:text-white"
          >
            I&apos;ll pay later
          </button>
        </div>
      </div>
    </div>
  );
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}
