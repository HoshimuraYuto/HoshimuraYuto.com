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
    <main className="flex items-center px-10 py-3 lt-sm:px-6">
      <div className="m-auto w-[1200px] flex items-center justify-between">
        <h1 className="text-4xl lt-sm:text-3xl">
          Hi 👋, I&apos;m Hoshimura Yuto.
        </h1>
      </div>
    </main>
  );
}
