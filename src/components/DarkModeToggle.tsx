import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  // Default: light mode. Only follow user's explicit past choice — never OS preference.
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
    const t = window.setTimeout(() => root.classList.remove("theme-transition"), 350);
    return () => window.clearTimeout(t);
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
