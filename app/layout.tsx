import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "人才貢獻決策中心",
  description: "人才貢獻與關鍵人才定位決策中心。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
