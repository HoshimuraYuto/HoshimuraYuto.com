import { ThemeChanger } from "./theme";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center gap-4">
      <ThemeChanger />
      <h1 className="text-2xl">Hi 👋, I&apos;m Hoshimura Yuto.</h1>
    </main>
  );
}
