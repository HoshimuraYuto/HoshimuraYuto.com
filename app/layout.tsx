import "./reset.css";
import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hi 👋, I'm Hoshimura Yuto.",
  description: "Personal website.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
