"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";

// Editable profile avatar — click to pick a photo; it's center-cropped to a
// square, compressed, uploaded, and saved on the member. A small camera badge
// in the corner is the affordance.
export function AvatarUploader({
  name,
  avatarUrl,
  size = 56,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setBusy(true);
    setPreview(URL.createObjectURL(f));
    try {
      const blob = await compressSquare(f, 512);
      const fd = new FormData();
      fd.set("file", blob, "avatar.jpg");
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd, credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("upload failed");
      router.refresh();
    } catch {
      setError("Couldn't upload — try again.");
      setPreview(null);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative rounded-full"
        title="Change profile picture"
        aria-label="Change profile picture"
      >
        <Avatar name={name} size={size} src={preview ?? avatarUrl} />
        <span className="absolute inset-0 rounded-full bg-black/30 opacity-0 transition group-hover:opacity-100" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-raised text-clay shadow-sm transition group-hover:text-coral">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      {error ? <span className="max-w-[7rem] text-center text-[10px] text-coral-deep">{error}</span> : null}
    </div>
  );
}

// Center-crop to a square and scale down to `edge`px, JPEG ~0.85.
async function compressSquare(file: File, edge: number): Promise<Blob> {
  try {
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("image load failed"));
      i.src = dataUrl;
    });
    const sideLen = Math.min(img.width, img.height);
    const sx = (img.width - sideLen) / 2;
    const sy = (img.height - sideLen) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = edge;
    canvas.height = edge;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, sx, sy, sideLen, sideLen, 0, 0, edge, edge);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}
