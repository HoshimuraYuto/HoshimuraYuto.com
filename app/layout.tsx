import "./reset.css";
import "./globals.css";

import Header from "./components/layouts/Header";
import { Providers } from "./providers";

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
    <html
      lang="ja"
      suppressHydrationWarning
    >
      <body className="bg-white color-neutral-9 transition duration-100 dark:bg-neutral-9 dark:color-neutral-1">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
