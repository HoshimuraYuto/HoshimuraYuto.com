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
    >
      <div className="i-carbon-sun dark:i-carbon-moon wh-4" />
    </Button>
  );
}
