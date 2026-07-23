import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "dark" || v === "light" || v === "system") return v;
  return "light";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark = mode === "dark" || (mode === "system" && systemPrefersDark());
  root.classList.add("theme-transition");
  root.classList.toggle("dark", isDark);
  window.setTimeout(() => root.classList.remove("theme-transition"), 350);
}

export function DarkModeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode());

  const setAndPersist = useCallback((next: ThemeMode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  // Follow OS preference live when in "system" mode.
  useEffect(() => {
    if (mode !== "system" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  const Icon = mode === "dark" ? Sun : mode === "system" ? Monitor : Moon;
  const label =
    mode === "system"
      ? "Tema: mengikuti sistem"
      : mode === "dark"
        ? "Tema: gelap"
        : "Tema: terang";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} title={label}>
          <Icon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setAndPersist("light")}>
          <Sun className="mr-2 h-4 w-4" /> Terang
          {mode === "light" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAndPersist("dark")}>
          <Moon className="mr-2 h-4 w-4" /> Gelap
          {mode === "dark" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAndPersist("system")}>
          <Monitor className="mr-2 h-4 w-4" /> Sistem
          {mode === "system" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
