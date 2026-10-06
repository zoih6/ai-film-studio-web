import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "استوديو أفلام AI — من فكرة إلى حزمة إنتاج جاهزة",
  description:
    "منصة عربية تفاعلية تحوّل فكرة الفيديو إلى حزمة إنتاج احترافية: برييف، ستوري بورد، وبرومبتات صور وحركة كاملة جاهزة للنسخ.",
  keywords: [
    "AI Film Studio",
    "توليد فيديو",
    "برومبت",
    "ستوري بورد",
    "إنتاج فيديو AI",
    "AI video production",
  ],
  authors: [{ name: "AI Film Studio" }],
  openGraph: {
    title: "استوديو أفلام AI",
    description: "من فكرة قصيرة إلى حزمة إنتاج فيديو كاملة بالذكاء الاصطناعي.",
    siteName: "AI Film Studio",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0D12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${plexArabic.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
