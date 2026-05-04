"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Heart, DollarSign, Users, Info } from "lucide-react";

const SEEN_COOKIE = "seen_rules";
const ONE_YEAR = 365 * 24 * 60 * 60;

type Props = {
  autoOpen?: boolean;
};

export function RulesButton({ autoOpen = false }: Props) {
  const [open, setOpen] = useState(autoOpen);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setOpen(false);
    // Mark rules as seen so we don't auto-open on every visit. Browser-wide
    // cookie; if the user signs in on a different device they'll see it once
    // there too. Re-openable any time via the "Rules" button.
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SEEN_COOKIE}=1; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax${secure}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20 hover:text-amber-100"
      >
        <Info className="h-3.5 w-3.5" />
        Rules
      </button>
      {open ? <RulesModal onClose={handleClose} /> : null}
    </>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Render via portal to escape any ancestor containing block (the header has
  // backdrop-blur, which traps position:fixed children inside it).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm fade-up"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/50 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 pr-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/80">
            How it works
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            The rules
          </h3>
        </div>

        <ul className="space-y-4 text-sm leading-relaxed text-zinc-300">
          <Rule
            icon={<Calendar className="h-4 w-4 text-amber-400" />}
            iconBg="bg-amber-400/15 ring-amber-400/30"
            title="Sign up = commit"
            body="If you join, you're in the club. Three sessions a week, every week."
          />
          <Rule
            icon={<Heart className="h-4 w-4 text-rose-400" />}
            iconBg="bg-rose-500/15 ring-rose-400/30"
            title="Self-paced, but same-day"
            body="Mon · Wed · Fri. Do the session any time during the day, but it must happen that day. ~20 minutes, beginner-friendly."
          />
          <Rule
            icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            iconBg="bg-emerald-400/15 ring-emerald-400/30"
            title="Miss a day → $50 to the pot"
            body="Honor system. Tap 'No, I didn't' and Venmo @AceJalali $50. No drama, no shame — happens to everyone."
          />
          <Rule
            icon={<Users className="h-4 w-4 text-violet-300" />}
            iconBg="bg-violet-400/15 ring-violet-400/30"
            title="End of month → group dinner"
            body="Whatever's in the pot funds dinner with everyone who participated. We're building a habit together — and eating together."
          />
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body
  );
}

function Rule({
  icon,
  iconBg,
  title,
  body,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${iconBg}`}>
        {icon}
      </span>
      <span>
        <strong className="block font-semibold text-white">{title}</strong>
        <span className="mt-0.5 block text-zinc-400">{body}</span>
      </span>
    </li>
  );
}
