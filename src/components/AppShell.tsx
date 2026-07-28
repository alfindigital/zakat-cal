import {
  Briefcase,
  Wallet,
  Wheat,
  Store,
  Sprout,
  Beef,
  Gem,
  Mountain,
  Moon,
} from "lucide-react";
import { ALL_PAGES, getPageBySlug } from "@/lib/seo";

type IconType = typeof Briefcase;

export const TAB_ICONS: Record<string, IconType> = {
  maal: Wallet,
  perniagaan: Store,
  pertanian: Sprout,
  peternakan: Beef,
  rikaz: Gem,
  madin: Mountain,
  fitrah: Wheat,
  fidyah: Moon,
};

// 4 most common types are always visible (bottom bar on mobile);
// the rest open via the shared "Lainnya" drawer.
export const PRIMARY_TABS = ["maal", "fitrah", "perniagaan", "pertanian"];

export const labelForTab = (tab: string) =>
  ALL_PAGES.find((p) => p.tab === tab)?.label ?? tab;

export const pathForTab = (tab: string) => {
  if (tab === "maal") return "/";
  const page = ALL_PAGES.find((p) => p.tab === tab);
  return page ? `/${page.slug}` : "/";
};

/**
 * Detects which calculator tab (if any) is currently active based on the URL.
 * Non-calculator pages (Pengaturan, Tentang, Panduan, Riwayat) return null so
 * the bottom nav shows no highlighted tab there.
 */
export const tabForPath = (pathname: string): string | null => {
  if (pathname === "/" || pathname === "") return "maal";
  const slug = pathname.replace(/^\//, "");
  const page = getPageBySlug(slug);
  return page?.tab ?? null;
};
