import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  Calculator,
  Settings2,
  Info,
  History,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ALL_PAGES, getPageBySlug } from "@/lib/seo";
import { track } from "@/lib/analytics";

type IconType = typeof Briefcase;

const TAB_ICONS: Record<string, IconType> = {
  penghasilan: Briefcase,
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
const PRIMARY_TABS = ["penghasilan", "maal", "fitrah", "perniagaan"];

const labelForTab = (tab: string) =>
  ALL_PAGES.find((p) => p.tab === tab)?.label ?? tab;

const pathForTab = (tab: string) => {
  if (tab === "penghasilan") return "/";
  const page = ALL_PAGES.find((p) => p.tab === tab);
  return page ? `/${page.slug}` : "/";
};

/**
 * Detects which calculator tab (if any) is currently active based on the URL.
 * Non-calculator pages (Pengaturan, Tentang, Panduan, Riwayat) return null so
 * the bottom nav shows no highlighted tab there.
 */
const tabForPath = (pathname: string): string | null => {
  if (pathname === "/" || pathname === "") return "penghasilan";
  const slug = pathname.replace(/^\//, "");
  const page = getPageBySlug(slug);
  return page?.tab ?? null;
};

interface AppShellProps {
  children: ReactNode;
  /** Optional slot rendered below the sticky header (e.g. pull-to-refresh indicator). */
  headerSlot?: ReactNode;
  /** Extra classes for the <main> wrapper. */
  mainClassName?: string;
  /** Skip the default max-width + padding on <main> (page renders its own container). */
  bareMain?: boolean;
}

/**
 * Shared app chrome: sticky header (logo + Riwayat/Pengaturan/Panduan icons)
 * and bottom category navigation (mobile). Every page uses this so the top
 * and bottom look identical across the app.
 */
export function AppShell({
  children,
  headerSlot,
  mainClassName,
  bareMain = false,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeTab = tabForPath(location.pathname);
  const moreActive = activeTab !== null && !PRIMARY_TABS.includes(activeTab);

  // Header icon "active" state for utility routes.
  const isRiwayat = location.pathname === "/riwayat";
  const isPengaturan = location.pathname === "/pengaturan";
  const isPanduan = location.pathname === "/panduan-zakat";

  const goToTab = (tab: string) => {
    navigate(pathForTab(tab));
    track("switch_tab", { tab });
  };

  const NavButton = ({ tab, short }: { tab: string; short: string }) => {
    const Icon = TAB_ICONS[tab] ?? Briefcase;
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => goToTab(tab)}
        aria-current={active ? "page" : undefined}
        aria-label={`Zakat ${labelForTab(tab)}`}
        title={`Zakat ${labelForTab(tab)}`}
        className="group relative flex flex-1 shrink-0 flex-col items-center justify-center gap-1 min-w-[60px] px-1 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-inset rounded-md"
      >
        <span
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
            active ? "bg-primary-foreground" : "group-hover:bg-primary-foreground/10"
          }`}
        >
          <Icon
            aria-hidden="true"
            strokeWidth={2.25}
            className={`h-6 w-6 transition-colors ${
              active ? "text-primary" : "text-primary-foreground group-hover:text-primary-foreground"
            }`}
          />
        </span>
        <span
          className={`text-[11px] font-semibold transition-colors ${
            active ? "text-primary-foreground" : "text-primary-foreground/90"
          }`}
        >
          {short}
        </span>
      </button>
    );
  };

  const headerIconClass = (active: boolean) =>
    `h-11 w-11 sm:h-10 sm:w-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
      active ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" : ""
    }`;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Sticky Header — identical on every page */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 gap-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="ZakatCal — beranda"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-extrabold tracking-tight sm:text-2xl truncate">
              Zakat<span className="text-primary">Cal</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={headerIconClass(isRiwayat)}
              aria-label="Riwayat Perhitungan"
              aria-current={isRiwayat ? "page" : undefined}
            >
              <Link to="/riwayat">
                <History className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={headerIconClass(isPengaturan)}
              aria-label="Pengaturan"
              aria-current={isPengaturan ? "page" : undefined}
            >
              <Link to="/pengaturan">
                <Settings2 className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={headerIconClass(isPanduan)}
              aria-label="Panduan Zakat"
              aria-current={isPanduan ? "page" : undefined}
            >
              <Link to="/panduan-zakat">
                <Info className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {headerSlot}

      {bareMain ? (
        children
      ) : (
        <main
          className={
            mainClassName ??
            "mx-auto max-w-2xl w-full px-4 py-5 sm:px-6 sm:py-8 flex-1 space-y-5"
          }
          style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </main>
      )}

      {/* Bottom Tab Navigation (mobile) — identical on every page */}
      <nav
        className="md:hidden fixed z-50 left-0 right-0 bottom-0 bg-primary border-t border-primary-foreground/10 shadow-[0_-4px_20px_-4px_hsl(var(--primary)/0.4)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Navigasi utama"
      >
        <div className="mx-auto max-w-3xl flex items-stretch h-20 justify-around px-1">
          <NavButton tab="penghasilan" short="Gaji" />
          <NavButton tab="maal" short="Maal" />
          <NavButton tab="fitrah" short="Fitrah" />
          <NavButton tab="perniagaan" short="Dagang" />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-label="Kategori zakat lainnya"
            aria-current={moreActive ? "page" : undefined}
            className="group relative flex flex-1 shrink-0 flex-col items-center justify-center gap-1 min-w-[60px] px-1 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-inset rounded-md"
          >
            <span
              className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
                moreActive ? "bg-primary-foreground" : "group-hover:bg-primary-foreground/10"
              }`}
            >
              <LayoutGrid
                aria-hidden="true"
                strokeWidth={2.25}
                className={`h-6 w-6 ${moreActive ? "text-primary" : "text-primary-foreground"}`}
              />
            </span>
            <span
              className={`text-[11px] font-semibold ${
                moreActive ? "text-primary-foreground" : "text-primary-foreground/90"
              }`}
            >
              Lainnya
            </span>
          </button>
        </div>
      </nav>

      {/* Shared "Lainnya" drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Semua Kategori</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-8 w-full max-w-md mx-auto">
            {ALL_PAGES.map((p) => {
              const Icon = TAB_ICONS[p.tab] ?? Briefcase;
              const active = activeTab === p.tab;
              return (
                <motion.button
                  key={p.tab}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    goToTab(p.tab);
                    setMoreOpen(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"
                  }`}
                >
                  <Icon aria-hidden="true" className={`h-6 w-6 ${active ? "text-primary" : "text-foreground"}`} />
                  <span className="text-xs font-medium">{p.label}</span>
                </motion.button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export { PRIMARY_TABS, TAB_ICONS, labelForTab, pathForTab, tabForPath };
