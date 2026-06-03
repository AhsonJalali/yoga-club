"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ExternalLink, X, Camera } from "lucide-react";
import { Avatar } from "./Avatar";
import { RatingPhotoModal } from "./RatingPhotoModal";
import { Member, CheckInStatus } from "../lib/supabase";
import { PENALTY_USD, venmoUrl } from "../lib/schedule";

type Props = {
  members: Member[];
  meId: string;
  sessionDate: string;
  initialStatusByMember: Record<string, CheckInStatus | undefined>;
  isRequiredDay: boolean;
  disabled?: boolean;
  disabledMessage?: string;
};

export function CheckInRoster({
  members,
  meId,
  sessionDate,
  initialStatusByMember,
  isRequiredDay,
  disabled = false,
  disabledMessage,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showVenmoModal, setShowVenmoModal] = useState(false);
  const [showMomentModal, setShowMomentModal] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, CheckInStatus | undefined>>(initialStatusByMember);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onMark = (status: "done" | "skipped" | "clear") => {
    const previous = statuses;
    const next = { ...previous };
    if (status === "clear") delete next[meId];
    else next[meId] = status;
    setStatuses(next);
    setErrorMsg(null);

    if (status === "skipped" && isRequiredDay) {
      setShowVenmoModal(true);
    }
    // After a Yes, invite a rating + optional photo.
    if (status === "done") {
      setShowMomentModal(true);
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("sessionDate", sessionDate);
        fd.set("status", status);
        const url = `${window.location.origin}/api/check-in`;
        const res = await fetch(url, {
          method: "POST",
          body: fd,
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) {
          let body = "";
          try { body = await res.text(); } catch {}
          console.error("[check-in] failed:", res.status, body);
          setStatuses(previous);
          if (res.status === 401) {
            setErrorMsg("Your session expired. Reload and sign in again.");
          } else {
            setErrorMsg("Couldn't save that check-in. Try again.");
          }
          return;
        }
        router.refresh();
      } catch (e) {
        console.error("[check-in] error:", e);
        setStatuses(previous);
        setErrorMsg("Network error saving check-in. Try again.");
      }
    });
  };

  const myStatus = statuses[meId];

  return (
    <section className="fade-up-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-display text-2xl font-medium text-ink">Your check-in</h3>
          <p className="text-sm text-faint">
            {isRequiredDay
              ? "Honor system. Be honest — both answers update the ranking."
              : "No required session today. Bonus credit if you practiced anyway."}
          </p>
        </div>
      </div>

      <MyCard
        name={members.find((m) => m.id === meId)?.name ?? "You"}
        avatarUrl={members.find((m) => m.id === meId)?.avatar_url ?? null}
        status={myStatus}
        onMark={onMark}
        onMoment={() => setShowMomentModal(true)}
        isRequiredDay={isRequiredDay}
        showVenmoOnSkip={isRequiredDay}
        disabled={disabled}
        disabledMessage={disabledMessage}
      />

      {errorMsg ? (
        <p className="mt-3 rounded-xl border border-coral-deep/30 bg-coral-deep/10 px-4 py-2 text-sm text-coral-deep">
          {errorMsg}
        </p>
      ) : null}

      {showVenmoModal ? <VenmoModal onClose={() => setShowVenmoModal(false)} /> : null}
      {showMomentModal ? <RatingPhotoModal sessionDate={sessionDate} onClose={() => setShowMomentModal(false)} /> : null}
    </section>
  );
}

function MyCard({
  name,
  avatarUrl,
  status,
  onMark,
  onMoment,
  isRequiredDay,
  showVenmoOnSkip,
  disabled = false,
  disabledMessage,
}: {
  name: string;
  avatarUrl: string | null;
  status: CheckInStatus | undefined;
  onMark: (status: "done" | "skipped" | "clear") => void;
  onMoment: () => void;
  isRequiredDay: boolean;
  showVenmoOnSkip: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const firstName = name.split(" ")[0];

  if (disabled) {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <Avatar name={name} src={avatarUrl} size={68} ring={null} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-faint">Coming soon, {firstName}</p>
            <h4 className="font-display mt-1 text-2xl font-medium text-ink">Check-in not active yet</h4>
            <p className="mt-1 text-sm text-muted">{disabledMessage ?? "These buttons activate on scheduled yoga days."}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button type="button" disabled aria-disabled="true" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-line bg-raised px-5 py-3 text-sm font-semibold text-faint">
              <CheckCircle2 className="h-4 w-4" /> Yes, I did it
            </button>
            <button type="button" disabled aria-disabled="true" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-line bg-raised px-5 py-3 text-sm font-semibold text-faint">
              <XCircle className="h-4 w-4" /> No, I didn&apos;t
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-sage/30 bg-sage/[0.06] p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar name={name} src={avatarUrl} size={68} ring="ok" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-sage">Logged · Done</p>
            <h4 className="font-display mt-1 text-2xl font-medium text-ink">Yes, {firstName} — solid work today.</h4>
            <p className="mt-1 text-sm text-muted">Counts toward your streak. See you next session.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onMoment} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-raised px-3 py-2 text-xs text-muted transition hover:text-ink">
              <Camera className="h-3.5 w-3.5" /> Rate / photo
            </button>
            <button type="button" onClick={() => onMark("clear")} className="rounded-lg border border-line bg-raised px-3 py-2 text-xs text-muted transition hover:text-ink">Undo</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "skipped") {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-coral-deep/30 bg-coral-deep/[0.06] p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <Avatar name={name} src={avatarUrl} size={68} ring="miss" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[11px] font-medium uppercase tracking-wider text-coral-deep">Logged · Skipped</p>
            <h4 className="font-display mt-1 text-2xl font-medium text-ink">
              {showVenmoOnSkip ? <>That&apos;s ${PENALTY_USD} into the pot, {firstName}.</> : <>Honest log — see you next session, {firstName}.</>}
            </h4>
            <p className="mt-1 text-sm text-muted">
              {showVenmoOnSkip ? "No big deal — happens. Square it now and start fresh." : "No penalty today. Rest is part of the work."}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            {showVenmoOnSkip ? (
              <a href={venmoUrl(PENALTY_USD, "Yoga Club — missed session")} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-ground transition hover:bg-coral-deep">
                Venmo ${PENALTY_USD} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <button type="button" onClick={() => onMark("clear")} className="rounded-lg border border-line bg-raised px-3 py-2 text-xs text-muted transition hover:text-ink">Undo</button>
          </div>
        </div>
      </div>
    );
  }

  // Undecided
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <Avatar name={name} src={avatarUrl} size={68} ring={null} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-clay">Your turn, {firstName}</p>
          <h4 className="font-display mt-1 text-2xl font-medium text-ink">
            {isRequiredDay ? "Did you do today's session?" : "Did you practice today?"}
          </h4>
          <p className="mt-1 text-sm text-muted">
            {isRequiredDay ? "Honest yes or no — both update the ranking." : "Yes counts as bonus credit. No is just an honest log — no penalty."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button type="button" onClick={() => onMark("done")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-5 py-3 text-sm font-semibold text-ground transition hover:bg-coral-deep active:scale-[0.98]">
            <CheckCircle2 className="h-4 w-4" /> Yes, I did it
          </button>
          <button type="button" onClick={() => onMark("skipped")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-raised px-5 py-3 text-sm font-medium text-muted transition hover:text-ink active:scale-[0.98]">
            <XCircle className="h-4 w-4" /> No, I didn&apos;t
          </button>
        </div>
      </div>
    </div>
  );
}

function VenmoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fade-up fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1.5 text-faint transition hover:bg-raised hover:text-ink">
          <X className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl bg-coral text-xl font-semibold text-ground">
            ${PENALTY_USD}
          </div>
          <h3 className="font-display mt-5 text-2xl font-medium text-ink">Into the pot</h3>
          <p className="mt-2 text-sm text-muted">
            ${PENALTY_USD} into the pot. Square it now and start fresh next session — no shame.
          </p>
          <a href={venmoUrl(PENALTY_USD, "Yoga Club — missed session")} target="_blank" rel="noreferrer" onClick={onClose} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-5 py-3 text-sm font-semibold text-ground transition hover:bg-coral-deep active:scale-[0.98]">
            Venmo ${PENALTY_USD} now <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button type="button" onClick={onClose} className="mt-3 text-xs text-faint transition hover:text-ink">I&apos;ll pay later</button>
        </div>
      </div>
    </div>
  );
}
