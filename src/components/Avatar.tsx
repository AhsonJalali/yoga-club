const PALETTE = [
  "from-amber-500 to-rose-500",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-indigo-600",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-fuchsia-500 to-purple-600",
  "from-orange-500 to-amber-500",
  "from-lime-500 to-emerald-500",
];

function gradientFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  name,
  size = 40,
  ring,
}: {
  name: string;
  size?: number;
  ring?: "ok" | "miss" | null;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const grad = gradientFor(name);
  const ringClass =
    ring === "ok"
      ? "ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-zinc-950"
      : ring === "miss"
      ? "ring-2 ring-rose-500/70 ring-offset-2 ring-offset-zinc-950"
      : "";
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      className={
        `inline-flex items-center justify-center rounded-full bg-gradient-to-br ${grad} font-semibold text-white shadow-lg shadow-black/30 ${ringClass}`
      }
      title={name}
    >
      {initials}
    </div>
  );
}
