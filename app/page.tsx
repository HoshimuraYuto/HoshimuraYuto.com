import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Hi 👋, I'm Hoshimura Yuto.",
  },
  description: "Personal website.",
  openGraph: {
    title: "Hi 👋, I'm Hoshimura Yuto.",
    description: "Personal website.",
    url: "https://hoshimurayuto.com",
    siteName: "Hi 👋, I'm Hoshimura Yuto.",
    images: "/favicon.png",
    locale: "ja_JP",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="flex items-center justify-center gap-4">
      <h1 className="text-2xl">Hi 👋, I&apos;m Hoshimura Yuto.</h1>
    </main>
  );
}
