"use client";

import { SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

type Props = { className?: string };

export function ContrastToggle({ className }: Props) {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme == "light" ? "dark" : "light");
  };

  return (
    <Button
      className={className + " p-2"}
      variant="ghost"
      aria-label="Toggle dark/light mode"
      onClick={toggleTheme}
    >
      <SunIcon />
    </Button>
  );
}
