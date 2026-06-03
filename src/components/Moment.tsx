"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Camera } from "lucide-react";
import { RatingPhotoModal } from "./RatingPhotoModal";

// Small camera badge shown when someone shared a photo. Click opens a lightbox.
export function MomentBadge({ photoUrl, memberName }: { photoUrl: string; memberName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`See ${memberName}'s moment`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-clay transition hover:border-coral/40 hover:text-coral"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      {open ? <MomentLightbox photoUrl={photoUrl} memberName={memberName} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

// Faint "+ photo" affordance on the member's own row when they did the session
// but skipped the photo. Opens the modal in photo-only mode.
export function ShareMomentButton({ sessionDate }: { sessionDate: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-line bg-raised px-2 text-[11px] text-muted transition hover:border-coral/40 hover:text-ink"
      >
        <Camera className="h-3 w-3" />
        <span>add photo</span>
      </button>
      {open ? <RatingPhotoModal sessionDate={sessionDate} mode="photo-only" onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function MomentLightbox({ photoUrl, memberName, onClose }: { photoUrl: string; memberName: string; onClose: () => void }) {
  return (
    <div className="fade-up fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80">
          <X className="h-4 w-4" />
        </button>
        <div className="relative aspect-square w-full bg-black">
          <Image src={photoUrl} alt={`${memberName}'s moment`} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" unoptimized />
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">Session moment</p>
          <p className="font-display mt-1 text-lg font-medium text-ink">{memberName}</p>
        </div>
      </div>
    </div>
  );
}
