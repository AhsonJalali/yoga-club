// Quiet, premium initials avatar — flat muted earth tones, hairline border,
// no rainbow gradients or heavy glow.
const PALETTE = [
  "#7d8a76", // sage
  "#9a7b5f", // clay
  "#b06a4f", // terracotta
  "#6f7d86", // slate
  "#8a7d6a", // taupe
  "#5f7468", // deep eucalyptus
  "#94795f", // sand
  "#7a6f86", // muted mauve
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  name,
  size = 40,
  ring,
  src,
}: {
  name: string;
  size?: number;
  ring?: "ok" | "miss" | null;
  src?: string | null;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const ringClass =
    ring === "ok"
      ? "ring-2 ring-sage ring-offset-2 ring-offset-ground"
      : ring === "miss"
      ? "ring-2 ring-coral-deep ring-offset-2 ring-offset-ground"
      : "";
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 ${ringClass}`}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span
          style={{ fontSize: Math.max(11, size * 0.36), backgroundColor: colorFor(name) }}
          className="flex h-full w-full items-center justify-center font-medium text-[#f1ebe1]"
        >
          {initials}
        </span>
      )}
    </div>
  );
}
