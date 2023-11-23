"use client";

import { useTheme } from "next-themes";

import { Button } from "./components/elements/Button";

export function ThemeChanger() {
  const { theme, setTheme } = useTheme();

  const handleTheme = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  return (
    <Button
      onClick={handleTheme}
      size="icon"
      aria-label="theme toggle"
    >
      <div className="min-wh-4 i-carbon-moon dark:i-carbon-sun" />
    </Button>
  );
}
