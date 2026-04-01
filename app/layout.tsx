import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Inflyio — Creator Intelligence Platform",
  description: "Score any YouTube channel across 12 tiers. Deep analytics, 6 KPIs, and content patterns for creators, brands, and agencies.",
  metadataBase: new URL("https://inflyio.com"),
  openGraph: {
    title: "Inflyio — Creator Intelligence Platform",
    description: "AI-powered influence scoring for YouTube creators.",
    url: "https://inflyio.com",
    siteName: "Inflyio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inflyio — Creator Intelligence Platform",
    description: "AI-powered influence scoring for YouTube creators.",
  },
  keywords: ["creator analytics", "youtube influence score", "influencer analytics", "creator intelligence", "inflyio"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#07070A", color: "#F9FAFB" }}>
        {children}
      </body>
    </html>
  );
}
