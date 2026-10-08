import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/app/ui/app-shell";
import { themeScript } from "@/app/ui/theme-script";
import { profile } from "@/lib/profile";
import { pageMetadata, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...pageMetadata({
    title: `${profile.name} | ${profile.role}`,
    description: `${profile.name} is a full-stack developer in Bulacan, Philippines, building web apps, business systems, Flutter mobile apps and AI features with Next.js, React, TypeScript and Supabase.`,
    path: "/",
  }),
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  keywords: [
    profile.name,
    "full-stack developer",
    "web developer Philippines",
    "Next.js developer",
    "Flutter developer",
    "freelance developer Bulacan",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      // The theme script sets data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
