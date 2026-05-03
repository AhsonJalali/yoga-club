import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { currentMember } from "../lib/session";
import { isSupabaseConfigured } from "../lib/supabase";
import { Avatar } from "../components/Avatar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yoga Club",
  description: "Three sessions a week. Building a habit together.",
  themeColor: "#07070a",
  openGraph: {
    title: "Yoga Club",
    description: "Three sessions a week. Building a habit together.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me = await currentMember();
  const demo = !isSupabaseConfigured();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {demo ? (
          <div className="border-b border-amber-400/20 bg-amber-400/10 px-6 py-1.5 text-center text-[11px] font-medium tracking-wide text-amber-300 backdrop-blur">
            DEMO MODE · fake data, check-ins won&apos;t save · connect Supabase to go live
          </div>
        ) : null}
        {me ? (
          <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="inline-block h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-lg shadow-rose-500/30 transition group-hover:scale-105" />
                <span className="text-sm font-semibold tracking-tight text-white">Yoga Club</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-zinc-400 sm:inline">{me.name}</span>
                <Avatar name={me.name} size={32} />
                <Link href="/logout" className="text-xs text-zinc-500 hover:text-white transition">
                  Sign out
                </Link>
              </div>
            </nav>
          </header>
        ) : null}
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
