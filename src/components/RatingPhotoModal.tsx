"use client";

import { useRef, useState } from "react";
import { Star, X, Camera, Loader2, Check } from "lucide-react";

type Props = {
  sessionDate: string;
  onClose: () => void;
  // "full" = stars + photo (post-Yes). "photo-only" = just the photo.
  mode?: "full" | "photo-only";
};

// Follow-up to a Yes-I-did check-in. Both pieces optional. Photo uploads to
// /api/upload-photo (writes the URL onto the row); rating PATCHes /api/check-in.
export function RatingPhotoModal({ sessionDate, onClose, mode = "full" }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const onSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (file) {
        const compressed = await compressIfNeeded(file);
        const fd = new FormData();
        fd.set("sessionDate", sessionDate);
        fd.set("file", compressed, "session.jpg");
        const res = await fetch(`${window.location.origin}/api/upload-photo`, { method: "POST", body: fd, credentials: "same-origin", cache: "no-store" });
        if (!res.ok) {
          console.error("[rating-modal] upload failed:", res.status, await safeText(res));
          throw new Error("Couldn't save your photo. Try again.");
        }
      }
      if (rating > 0) {
        const fd = new FormData();
        fd.set("sessionDate", sessionDate);
        fd.set("rating", String(rating));
        const res = await fetch(`${window.location.origin}/api/check-in`, { method: "POST", body: fd, credentials: "same-origin", cache: "no-store" });
        if (!res.ok) {
          console.error("[rating-modal] rating patch failed:", res.status, await safeText(res));
          throw new Error("Couldn't save your rating. Try again.");
        }
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const nothingToSave = rating === 0 && !file;

  return (
    <div className="fade-up fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => (saving ? null : onClose())}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} disabled={saving} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1.5 text-faint transition hover:bg-raised hover:text-ink disabled:opacity-50">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl border border-sage/30 bg-sage/10 text-sage">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="font-display mt-5 text-2xl font-medium text-ink">
            {mode === "photo-only" ? "Share your moment" : "Nice work"}
          </h3>
          <p className="mt-2 text-sm text-muted">
            {mode === "photo-only"
              ? "Add a photo to today's check-in. Selfie, mat, pose — whatever."
              : "Rate your session and share a moment if you want. Both optional."}
          </p>
        </div>

        {mode === "full" ? (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-faint">How was today&apos;s session?</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hover || rating) >= n;
                return (
                  <button key={n} type="button" aria-label={`${n} star${n === 1 ? "" : "s"}`} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="rounded-lg p-1 transition active:scale-90" disabled={saving}>
                    <Star className={`h-9 w-9 transition ${active ? "fill-coral text-coral" : "fill-transparent text-line-strong"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">
            Share your moment <span aria-hidden>📸</span>
            {mode === "full" ? <span className="text-faint/70"> (optional)</span> : null}
          </p>
          <div className="mt-3">
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-line bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="h-48 w-full object-cover" />
                <button type="button" onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} disabled={saving} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition hover:bg-black/90 disabled:opacity-50" aria-label="Remove photo">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-raised px-4 py-6 text-sm text-muted transition hover:border-coral/40 ${saving ? "pointer-events-none opacity-50" : ""}`}>
                <Camera className="h-5 w-5 text-clay" />
                <span>{mode === "photo-only" ? "Tap to share a photo" : "Tap to take or upload a photo"}</span>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} disabled={saving} />
              </label>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-coral-deep/30 bg-coral-deep/10 px-4 py-2 text-sm text-coral-deep">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-line bg-raised px-4 py-2.5 text-sm text-muted transition hover:text-ink disabled:opacity-50">
            {mode === "photo-only" ? "Cancel" : "Skip"}
          </button>
          <button type="button" onClick={onSave} disabled={saving || nothingToSave} className="inline-flex items-center justify-center gap-2 rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-ground transition hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return ""; }
}

// Down-scale large photos in the browser to keep upload sizes sane.
async function compressIfNeeded(file: File): Promise<Blob> {
  if (file.size <= 2 * 1024 * 1024) return file;
  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const maxEdge = 1600;
    let { width, height } = img;
    if (width > maxEdge || height > maxEdge) {
      if (width >= height) { height = Math.round((height * maxEdge) / width); width = maxEdge; }
      else { width = Math.round((width * maxEdge) / height); height = maxEdge; }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8));
    return blob ?? file;
  } catch (e) {
    console.warn("[rating-modal] compression failed, sending original:", e);
    return file;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
