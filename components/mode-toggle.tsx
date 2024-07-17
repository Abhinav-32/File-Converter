// mode-toggle.tsx
"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button"; // Make sure the path is correct
import { SunIcon, MoonIcon } from "lucide-react"; // Import the icons

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="ghost" onClick={toggleTheme}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
