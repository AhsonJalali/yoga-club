import { ImageResponse } from "next/og";
import { currentMember } from "../../../lib/session";
import { supabase, isSupabaseConfigured, Member, ClassItem, CheckIn, Challenge, ChallengeParticipant } from "../../../lib/supabase";
import { DEMO_MEMBERS, DEMO_CLASSES, DEMO_CHECK_INS, DEMO_CHALLENGES, DEMO_PARTICIPANTS } from "../../../lib/demo";
import { revealedRecapChallenge } from "../../../lib/challenges";
import { BUCKETS, BucketKey, bucketMeta, computeRecap, MemberRecap, GroupRecap } from "../../../lib/recap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Story-format share card (9:16). Rendered with next/og so output is identical
// everywhere — no html2canvas / Tailwind-oklch rendering quirks.
const W = 1080;
const H = 1920;

const BUCKET_COLOR: Record<BucketKey, string> = {
  earlyMorning: "#e07a52",
  morning: "#e07a52",
  afternoon: "#e07a52",
  evening: "#e07a52",
  lateNight: "#e07a52",
};

export async function GET() {
  const me = await currentMember();

  let members: Member[];
  let classes: ClassItem[];
  let checkIns: CheckIn[];
  let challenges: Challenge[];
  let participants: ChallengeParticipant[];
  if (isSupabaseConfigured()) {
    const sb = supabase();
    const [a, b, c, d, e] = await Promise.all([
      sb.from("members").select("*").order("name"),
      sb.from("classes").select("*"),
      sb.from("check_ins").select("*"),
      sb.from("challenges").select("*"),
      sb.from("challenge_participants").select("*"),
    ]);
    members = (a.data ?? []) as Member[];
    classes = (b.data ?? []) as ClassItem[];
    checkIns = (c.data ?? []) as CheckIn[];
    challenges = (d.data ?? []) as Challenge[];
    participants = (e.data ?? []) as ChallengeParticipant[];
  } else {
    members = DEMO_MEMBERS;
    classes = DEMO_CLASSES;
    checkIns = DEMO_CHECK_INS;
    challenges = DEMO_CHALLENGES;
    participants = DEMO_PARTICIPANTS;
  }

  const challenge = revealedRecapChallenge(challenges);
  const ZERO_GROUP: GroupRecap = { potTotal: 0, missedTotal: 0, totalSessions: 0, totalMinutes: 0, totalHours: 0, favorite: null, buckets: [], memberCount: 0, participants: 0, honorRoll: [] };
  const { byMember, group } = challenge
    ? computeRecap(members, classes, checkIns, challenge, participants)
    : { byMember: new Map<string, MemberRecap>(), group: ZERO_GROUP };
  const mine = me && challenge ? byMember.get(me.id) : undefined;
  const name = me?.name ?? "Yogi";
  const challengeName = challenge?.name ?? "Yoga Club";
  const penalty = challenge?.penalty_usd ?? 25;

  const sessions = mine?.sessions ?? 0;
  const minutes = mine?.minutes ?? 0;
  const hours = mine?.hours ?? 0;
  const fav = mine?.favorite ? bucketMeta(mine.favorite) : null;
  const completed = mine?.completed ?? 0;
  const eligible = mine?.eligible ?? 0;
  const pct = mine?.completionPct ?? 0;
  const streak = mine?.bestStreak ?? 0;
  const buckets = mine?.buckets ?? BUCKETS.map((b) => ({ key: b.key, count: 0 }));
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const tileStyle = {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: "28px 26px",
  };
  const tileLabel = {
    display: "flex" as const,
    fontSize: 22,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
    color: "#a89d8d",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #171310 0%, #14110d 60%, #1b1612 100%)",
          color: "#f1ebe1",
          fontFamily: "sans-serif",
          padding: "70px 64px",
          position: "relative",
        }}
      >
        {/* glows */}
        <div style={{ position: "absolute", top: -120, left: -120, width: 420, height: 420, borderRadius: 420, background: "rgba(224,122,82,0.13)", filter: "blur(60px)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -140, right: -120, width: 460, height: 460, borderRadius: 460, background: "rgba(163,178,154,0.11)", filter: "blur(60px)", display: "flex" }} />

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#e07a52,#c2926a)", display: "flex" }} />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "#c2926a" }}>
            {challengeName} · Yoga Club
          </div>
        </div>

        {/* hero */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            Congratulations,
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: "#e07a52" }}>
            {name}!
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#cbbfae" }}>
            Here&apos;s your month on the mat.
          </div>
        </div>

        {/* big sessions number */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
          <div style={{ display: "flex", fontSize: 240, fontWeight: 800, lineHeight: 1, background: "linear-gradient(90deg,#e8845c,#e07a52,#c2603a)", backgroundClip: "text", color: "transparent" }}>
            {sessions}
          </div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#e8845c", marginTop: 6 }}>
            Yoga Sessions
          </div>
        </div>

        {/* stat tiles */}
        <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
          <div style={tileStyle}>
            <div style={tileLabel}>On the mat</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 800, marginTop: 12 }}>{minutes} min</div>
            <div style={{ display: "flex", fontSize: 26, color: "#a89d8d", marginTop: 4 }}>≈ {hours} hours</div>
          </div>
          <div style={tileStyle}>
            <div style={tileLabel}>Consistency</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 800, marginTop: 12 }}>{completed}/{eligible}</div>
            <div style={{ display: "flex", fontSize: 26, color: "#a89d8d", marginTop: 4 }}>
              {pct}%{streak > 1 ? ` · ${streak} in a row` : ""}
            </div>
          </div>
        </div>

        {/* favorite time + bar chart */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 24,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            padding: "30px 30px 26px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>When you practiced</div>
            <div style={{ display: "flex", fontSize: 26, color: fav ? "#e8845c" : "#786d5e" }}>
              {fav ? `${fav.label} yogi` : "—"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, height: 280, marginTop: 26 }}>
            {BUCKETS.map((meta) => {
              const count = buckets.find((b) => b.key === meta.key)?.count ?? 0;
              const barH = Math.max(count > 0 ? 18 : 6, (count / maxCount) * 230);
              const isFav = mine?.favorite === meta.key;
              return (
                <div key={meta.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: isFav ? "white" : "#786d5e", marginBottom: 8 }}>{count}</div>
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: barH,
                      borderRadius: 12,
                      background: isFav ? BUCKET_COLOR[meta.key] : "rgba(255,255,255,0.12)",
                    }}
                  />
                  <div style={{ display: "flex", fontSize: 22, color: isFav ? "white" : "#a89d8d", marginTop: 12, textAlign: "center" }}>
                    {meta.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* club strip */}
        <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
          <div style={{ ...tileStyle, alignItems: "center", textAlign: "center" }}>
            <div style={tileLabel}>The pot</div>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 800, marginTop: 8 }}>${group.potTotal}</div>
            <div style={{ display: "flex", fontSize: 22, color: "#a89d8d", marginTop: 2 }}>{group.missedTotal} misses · ${penalty} each</div>
          </div>
          <div style={{ ...tileStyle, alignItems: "center", textAlign: "center" }}>
            <div style={tileLabel}>The club</div>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 800, marginTop: 8 }}>{group.totalSessions}</div>
            <div style={{ display: "flex", fontSize: 22, color: "#a89d8d", marginTop: 2 }}>sessions · {group.totalHours} hrs together</div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, fontSize: 26, color: "#786d5e" }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg,#e07a52,#c2926a)", display: "flex" }} />
          Three sessions a week. Building a habit together.
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Content-Disposition": 'inline; filename="my-yoga-may.png"',
        "Cache-Control": "no-store",
      },
    }
  );
}
