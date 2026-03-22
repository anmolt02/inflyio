import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inflyio — Creator Intelligence",
  description: "AI-powered influence scoring for YouTube creators.",
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
