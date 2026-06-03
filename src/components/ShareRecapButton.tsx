"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";

// Fetches the server-rendered share card (/recap/card) and either opens the
// native share sheet (mobile) with the PNG attached, or downloads it.
export function ShareRecapButton() {
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/recap/card", { cache: "no-store" });
      if (!res.ok) throw new Error("card failed");
      const blob = await res.blob();
      const file = new File([blob], "my-yoga-may.png", { type: "image/png" });

      const nav = navigator as Navigator & {
        canShare?: (data?: { files?: File[] }) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "My May in Yoga 🧘" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-yoga-may.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Last resort: open the image so the user can save it manually.
      window.open("/recap/card", "_blank");
    } finally {
      setBusy(false);
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { canShare?: unknown }).canShare === "function";

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg bg-coral px-5 py-3 text-sm font-semibold text-ground transition hover:bg-coral-deep disabled:opacity-60"
    >
      {canNativeShare ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      {busy ? "Preparing image…" : canNativeShare ? "Share your recap" : "Download your recap"}
    </button>
  );
}
