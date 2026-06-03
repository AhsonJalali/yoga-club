import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cookies } from "next/headers";
import { currentMember } from "../lib/session";
import { isSupabaseConfigured } from "../lib/supabase";
import { Avatar } from "../components/Avatar";
import { RulesButton } from "../components/RulesButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif for display headings — boutique-studio feel.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Yoga Club",
  description: "Three sessions a week. Building a habit together.",
  openGraph: {
    title: "Yoga Club",
    description: "Three sessions a week. Building a habit together.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#14110d",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me = await currentMember();
  const demo = !isSupabaseConfigured();
  const jar = await cookies();
  const seenRules = jar.get("seen_rules")?.value === "1";
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {demo ? (
          <div className="border-b border-clay/20 bg-clay/10 px-6 py-1.5 text-center text-[11px] font-medium tracking-wide text-clay">
            DEMO MODE · fake data, check-ins won&apos;t save · connect Supabase to go live
          </div>
        ) : null}
        {me ? (
          <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur-sm">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
              <Link href="/" className="group flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-raised text-coral transition group-hover:border-coral/50">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1.6 2.4 1.6 5.2 0 7.6C10.4 8.2 10.4 5.4 12 3Z"/><path d="M5 13c2.8-.4 5.4.6 7 2.8-2.8.4-5.4-.6-7-2.8Z"/><path d="M19 13c-2.8-.4-5.4.6-7 2.8 2.8.4 5.4-.6 7-2.8Z"/><path d="M12 15.8V21"/></svg>
                </span>
                <span className="font-display text-base font-medium tracking-tight text-ink">Yoga Club</span>
              </Link>
              <div className="flex items-center gap-4">
                <RulesButton autoOpen={!seenRules} />
                <span className="hidden h-4 w-px bg-line-strong sm:inline-block" />
                <Link href="/me" className="group flex items-center gap-2.5" title="Your profile & stats">
                  <span className="hidden text-xs text-muted transition group-hover:text-ink sm:inline">{me.name}</span>
                  <Avatar name={me.name} size={30} src={me.avatar_url} />
                </Link>
                <form action="/logout" method="POST">
                  <button
                    type="submit"
                    className="text-xs text-faint transition hover:text-ink"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </nav>
          </header>
        ) : null}
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
