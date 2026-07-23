import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const ORDER: ThemeMode[] = ["light", "dark", "system"];

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

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length];
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  // Follow OS preference live while in "system" mode.
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
      ? "Tema: Sistem (klik untuk ganti)"
      : mode === "dark"
        ? "Tema: Gelap (klik untuk ganti)"
        : "Tema: Terang (klik untuk ganti)";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
