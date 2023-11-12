import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hi 👋, I'm Hoshimura Yuto.",
  description: "Personal website.",
  openGraph: {
    title: "Hi 👋, I'm Hoshimura Yuto.",
    description: "Personal website.",
  },
};

export default function Home() {
  return (
    <main className="flex items-center justify-center gap-4">
      <h1 className="text-2xl">Hi 👋, I&apos;m Hoshimura Yuto.</h1>
    </main>
  );
}
