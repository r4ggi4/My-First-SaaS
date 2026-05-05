import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://my-first-saa-s-three.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "BlogAI — AI Blog Generator",
    template: "%s | BlogAI",
  },
  description:
    "Generate high-quality, SEO-optimized blog content in minutes. Powered by Claude AI, built for creators.",
  openGraph: {
    type: "website",
    siteName: "BlogAI",
    title: "BlogAI — AI Blog Generator",
    description:
      "Generate high-quality, SEO-optimized blog content in minutes. Powered by Claude AI, built for creators.",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "BlogAI — AI Blog Generator",
    description:
      "Generate high-quality, SEO-optimized blog content in minutes. Powered by Claude AI, built for creators.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
