import "./reset.css";
import "./globals.css";

import Footer from "./components/layouts/Footer";
import Header from "./components/layouts/Header";
import { Providers } from "./providers";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hi 👋, I'm Hoshimura Yuto.",
  description: "Personal website.",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
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
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
