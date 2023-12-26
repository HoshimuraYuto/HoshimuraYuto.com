import "./reset.css";
import "./globals.css";

import Footer from "./components/layouts/Footer";
import Header from "./components/layouts/Header";
import { Providers } from "./providers";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Hoshimura Yuto",
    default: "Hi 👋, I'm Hoshimura Yuto.",
  },
  description: "Personal website.",
  metadataBase: new URL("https://hoshimurayuto.com"),
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/favicon.png",
    },
  },
  manifest: "/manifest.json",
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

// export const runtime = "edge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className="scroll-smooth"
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
