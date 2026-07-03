import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchGoldPrice,
  getHistory,
  subscribeHistory,
  loadStoredPrices,
  saveStoredPrices,
  loadRoundUp,
  saveRoundUp,
  getNisab,
  formatRupiah,
  migrateStorage,
  decodeSharedResult,
  type NisabType,
  type PriceSource,
} from "@/lib/zakat";
import { getHaulReminders, haulEndDate, daysUntil } from "@/lib/haul";
import { RoundUpContext } from "@/lib/round-context";
import { Switch } from "@/components/ui/switch";
import ZakatPenghasilan from "@/components/ZakatPenghasilan";
import ZakatMaal from "@/components/ZakatMaal";
import ZakatFitrah from "@/components/ZakatFitrah";
import ZakatPerniagaan from "@/components/ZakatPerniagaan";
import ZakatPertanian from "@/components/ZakatPertanian";
import ZakatPeternakan from "@/components/ZakatPeternakan";
import ZakatRikaz from "@/components/ZakatRikaz";
import ZakatMadin from "@/components/ZakatMadin";
import ZakatFidyah from "@/components/ZakatFidyah";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import ZakatRiwayat from "@/components/ZakatRiwayat";
import HaulReminder from "@/components/HaulReminder";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Briefcase, Wallet, Wheat, Settings2, Loader2, Store, Sprout, Beef, Gem, Mountain, Info, Moon, LayoutGrid, ShieldCheck, RefreshCw, CalendarClock } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ALL_PAGES, HOME_SEO, getPageBySlug, useSeo, type ZakatPage } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { loadMazhab, saveMazhab, MAZHAB_NOTES, type Mazhab } from "@/lib/mazhab";

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

// 4 most common types are always visible (top on desktop, bottom bar on mobile);
// the rest open via the shared "Lainnya" drawer — identical structure everywhere.
const PRIMARY_TABS = ["penghasilan", "maal", "fitrah", "perniagaan"];

const labelForTab = (tab: string) => ALL_PAGES.find((p) => p.tab === tab)?.label ?? tab;

const pathForTab = (tab: string) => {
  if (tab === "penghasilan") return "/";
  const page = ALL_PAGES.find((p) => p.tab === tab);
  return page ? `/${page.slug}` : "/";
};
const tabForPath = (pathname: string) => {
  if (pathname === "/" || pathname === "") return "penghasilan";
  const slug = pathname.replace(/^\//, "");
  return getPageBySlug(slug)?.tab ?? "penghasilan";
};

const NisabSettings = ({
  nisabType,
  setNisabType,
  goldInput,
  silverInput,
  onGoldChange,
  onSilverChange,
  onRefresh,
  refreshing,
  priceMeta,
  roundUp,
  onRoundUpChange,
  mazhab,
  onMazhabChange,
}: {
  nisabType: NisabType;
  setNisabType: (v: NisabType) => void;
  goldInput: string;
  silverInput: string;
  onGoldChange: (v: string) => void;
  onSilverChange: (v: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  priceMeta: { date: string; source: PriceSource };
  roundUp: boolean;
  onRoundUpChange: (v: boolean) => void;
  mazhab: Mazhab;
  onMazhabChange: (m: Mazhab) => void;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground font-medium">Mazhab / Preferensi Fiqh</Label>
      <ToggleGroup
        type="single"
        value={mazhab}
        onValueChange={(v) => v && onMazhabChange(v as Mazhab)}
        className="w-full gap-0 rounded-lg border border-border/60 p-0.5"
      >
        <ToggleGroupItem value="jumhur" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          Jumhur
        </ToggleGroupItem>
        <ToggleGroupItem value="hanafi" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          Hanafi
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-[11px] text-muted-foreground leading-snug">{MAZHAB_NOTES[mazhab].maal}</p>
    </div>

    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground font-medium">Standar Nisab</Label>
      <ToggleGroup
        type="single"
        value={nisabType}
        onValueChange={(v) => v && setNisabType(v as NisabType)}
        className="w-full gap-0 rounded-lg border border-border/60 p-0.5"
      >
        <ToggleGroupItem value="gold" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          🥇 Emas (85g)
        </ToggleGroupItem>
        <ToggleGroupItem value="silver" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          🥈 Perak (595g)
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
    <div className="space-y-2">
      <Label htmlFor="gold-price-sheet" className="text-sm text-muted-foreground font-medium">Harga Emas per gram (Rp)</Label>
      <Input
        id="gold-price-sheet"
        type="text"
        inputMode="decimal"
        pattern="[0-9]*"
        value={goldInput}
        onChange={(e) => onGoldChange(e.target.value.replace(/\D/g, ""))}
        className="h-12 text-base font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="2000000"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="silver-price-sheet" className="text-sm text-muted-foreground font-medium">Harga Perak per gram (Rp)</Label>
      <Input
        id="silver-price-sheet"
        type="text"
        inputMode="decimal"
        pattern="[0-9]*"
        value={silverInput}
        onChange={(e) => onSilverChange(e.target.value.replace(/\D/g, ""))}
        className="h-12 text-base font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="28000"
      />
    </div>
    <div className="flex items-center justify-between gap-2 pt-1">
      <p className="text-xs text-muted-foreground">
        {priceMeta.source === "online" ? "Harga online" : priceMeta.source === "manual" ? "Harga manual" : "Harga default"} • {priceMeta.date}
      </p>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="h-9 text-xs">
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Perbarui online
      </Button>
    </div>
    <p className="text-[11px] text-muted-foreground">Harga yang Anda atur tersimpan di perangkat ini.</p>

    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
      <div className="min-w-0">
        <Label htmlFor="roundup-switch" className="text-sm font-medium">Bulatkan zakat ke atas</Label>
        <p className="text-[11px] text-muted-foreground">Pembulatan ihtiyat ke Rp 1.000 terdekat.</p>
      </div>
      <Switch id="roundup-switch" checked={roundUp} onCheckedChange={onRoundUpChange} />
    </div>
  </div>
);

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stored = useMemo(() => loadStoredPrices(), []);
  const [goldPrice, setGoldPrice] = useState(stored.gold);
  const [goldInput, setGoldInput] = useState(String(stored.gold));
  const [silverPrice, setSilverPrice] = useState(stored.silver);
  const [silverInput, setSilverInput] = useState(String(stored.silver));
  const [priceMeta, setPriceMeta] = useState<{ date: string; source: PriceSource }>({ date: stored.date, source: stored.source });
  const [nisabType, setNisabType] = useState<NisabType>("gold");
  const [roundUp, setRoundUp] = useState(() => loadRoundUp());
  const [mazhab, setMazhab] = useState<Mazhab>(() => loadMazhab());
  const handleMazhabChange = useCallback((m: Mazhab) => {
    setMazhab(m);
    saveMazhab(m);
  }, []);
  const [history, setHistory] = useState(getHistory());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isMobile = useIsMobile();
  const activeTab = tabForPath(location.pathname);
  const activePage: ZakatPage | undefined = ALL_PAGES.find((p) => p.tab === activeTab);

  // Per-route SEO (title/meta/canonical/OG) — home keeps the generic title.
  // Also emits per-page JSON-LD (BreadcrumbList + HowTo) so category routes
  // qualify for rich results and are quotable by AI search.
  const isHome = location.pathname === "/";
  const routeJsonLd = useMemo(() => {
    if (!activePage || isHome) return null;
    const url = `https://zakat-cal.lovable.app/${activePage.slug}`;
    const graph: object[] = [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: "https://zakat-cal.lovable.app/" },
          { "@type": "ListItem", position: 2, name: activePage.label, item: url },
        ],
      },
    ];
    if (activePage.sections.length > 0) {
      graph.push({
        "@type": "HowTo",
        name: activePage.h1,
        description: activePage.intro,
        step: activePage.sections.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.heading,
          text: s.body,
        })),
      });
    }
    return { "@context": "https://schema.org", "@graph": graph };
  }, [activePage, isHome]);

  useSeo({
    title: isHome ? HOME_SEO.title : activePage?.title ?? HOME_SEO.title,
    description: isHome ? HOME_SEO.description : activePage?.description ?? HOME_SEO.description,
    path: location.pathname,
    jsonLd: routeJsonLd,
  });

  const setActiveTab = (tab: string) => {
    navigate(pathForTab(tab));
    track("switch_tab", { tab });
  };

  // Pull-to-refresh state
  const mainRef = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const persistPrices = useCallback((gold: number, silver: number, source: PriceSource) => {
    saveStoredPrices(gold, silver, source);
    const m = loadStoredPrices();
    setPriceMeta({ date: m.date, source: m.source });
  }, []);

  const refreshGoldPrice = useCallback(async () => {
    setRefreshing(true);
    try {
      const g = await fetchGoldPrice();
      if (g.isDefault) {
        toast.error("Gagal memuat harga online", { description: "Memakai harga tersimpan." });
      } else {
        setGoldPrice(g.price);
        setGoldInput(String(g.price));
        persistPrices(g.price, silverPrice, "online");
        toast.success("Harga emas diperbarui", { description: `Rp ${g.price.toLocaleString("id-ID")} / gram` });
      }
    } catch {
      toast.error("Gagal memuat harga emas");
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [silverPrice, persistPrices]);

  const handleGoldChange = (val: string) => {
    setGoldInput(val);
    const num = Number(val);
    if (num > 0) {
      setGoldPrice(num);
      persistPrices(num, silverPrice, "manual");
    }
  };

  const handleSilverChange = (val: string) => {
    setSilverInput(val);
    const num = Number(val);
    if (num > 0) {
      setSilverPrice(num);
      persistPrices(goldPrice, num, "manual");
    }
  };

  const metalPrice = nisabType === "gold" ? goldPrice : silverPrice;
  const currentNisab = getNisab(metalPrice, nisabType);
  const refreshHistory = useCallback(() => setHistory(getHistory()), []);

  // Real-time sync: same-tab mutations + cross-tab `storage` events.
  useEffect(() => subscribeHistory(refreshHistory), [refreshHistory]);

  // In-app reminder: alert once on load when any haul is due/overdue.
  const haulAlerted = useRef(false);
  useEffect(() => {
    if (haulAlerted.current) return;
    const due = getHaulReminders().filter((r) => daysUntil(haulEndDate(r.startDate)) <= 0);
    if (due.length > 0) {
      haulAlerted.current = true;
      toast.info("Haul jatuh tempo", {
        description: `${due.length} harta sudah mencapai haul — saatnya menghitung zakat.`,
        duration: 8000,
      });
    }
  }, []);

  // One-time storage migration on app mount (idempotent).
  useEffect(() => {
    migrateStorage();
  }, []);

  // Parse ?share=... deep-link and greet the visitor with the shared result.
  const sharedGreeted = useRef(false);
  useEffect(() => {
    if (sharedGreeted.current) return;
    const params = new URLSearchParams(location.search);
    const token = params.get("share");
    if (!token) return;
    const shared = decodeSharedResult(token);
    if (!shared) return;
    sharedGreeted.current = true;
    toast.success(`Hasil zakat dibagikan: ${shared.type}`, {
      description: `${formatRupiah(shared.amount)}${shared.label ? ` — ${shared.label}` : ""}`,
      duration: 8000,
    });
    // Clean the URL so refresh doesn't re-toast.
    const cleaned = new URL(window.location.href);
    cleaned.searchParams.delete("share");
    window.history.replaceState({}, "", cleaned.pathname + cleaned.search + cleaned.hash);
  }, [location.search]);


  // Pull-to-refresh handlers (mobile only)
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (window.scrollY <= 0) touchStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(dy * 0.5, 80));
    }
  };
  const onTouchEnd = () => {
    if (!isMobile) return;
    if (pullDistance > 60 && !refreshing) {
      refreshGoldPrice();
    } else {
      setPullDistance(0);
    }
    touchStartY.current = null;
  };

  const renderCalc = (tab: string) => {
    const isActive = activeTab === tab;
    switch (tab) {
      case "penghasilan":
        return <ZakatPenghasilan metalPrice={metalPrice} nisabType={nisabType} isActive={isActive} onCalculated={refreshHistory} />;
      case "maal":
        return <ZakatMaal goldPrice={goldPrice} silverPrice={silverPrice} nisabType={nisabType} isActive={isActive} onCalculated={refreshHistory} />;
      case "perniagaan":
        return <ZakatPerniagaan goldPrice={goldPrice} isActive={isActive} onCalculated={refreshHistory} />;
      case "pertanian":
        return <ZakatPertanian isActive={isActive} onCalculated={refreshHistory} />;
      case "peternakan":
        return <ZakatPeternakan isActive={isActive} onCalculated={refreshHistory} />;
      case "rikaz":
        return <ZakatRikaz isActive={isActive} onCalculated={refreshHistory} />;
      case "madin":
        return <ZakatMadin goldPrice={goldPrice} isActive={isActive} onCalculated={refreshHistory} />;
      case "fitrah":
        return <ZakatFitrah isActive={isActive} onCalculated={refreshHistory} />;
      case "fidyah":
        return <ZakatFidyah isActive={isActive} onCalculated={refreshHistory} />;
      default:
        return null;
    }
  };

  const NavButton = ({ tab, short }: { tab: string; short: string }) => {
    const Icon = TAB_ICONS[tab] ?? Briefcase;
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        aria-current={active ? "page" : undefined}
        aria-label={`Zakat ${labelForTab(tab)}`}
        title={`Zakat ${labelForTab(tab)}`}
        className="group relative flex flex-1 shrink-0 flex-col items-center justify-center gap-1 min-w-[60px] px-1 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-inset rounded-md"
      >
        <span className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${active ? "bg-primary-foreground" : "group-hover:bg-primary-foreground/10"}`}>
          <Icon aria-hidden="true" strokeWidth={2.25} className={`h-6 w-6 transition-colors ${active ? "text-primary" : "text-primary-foreground group-hover:text-primary-foreground"}`} />
        </span>
        <span className={`text-[11px] font-semibold transition-colors ${active ? "text-primary-foreground" : "text-primary-foreground/90"}`}>
          {short}
        </span>
      </button>
    );
  };

  const moreActive = !PRIMARY_TABS.includes(activeTab);

  // Shared desktop pill styling for primary tabs + the "Lainnya" trigger.
  const desktopPill = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`;

  return (
    <RoundUpContext.Provider value={roundUp}>
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 gap-2">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="ZakatCal — beranda">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-extrabold tracking-tight sm:text-2xl truncate">
              Zakat<span className="text-primary">Cal</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {/* Settings: nisab, prices, rounding, haul reminder */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Pengaturan">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pengaturan</DialogTitle>
                  <DialogDescription className="sr-only">
                    Atur nisab, harga emas/perak, pembulatan zakat, dan pengingat haul.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 space-y-5">
                  {/* Current nisab (moved here to keep the home clean) */}
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Nisab saat ini</p>
                    <p className="text-base font-bold tabular-nums">
                      {formatRupiah(currentNisab)}
                      <span className="text-muted-foreground font-normal"> · {nisabType === "gold" ? "85g emas" : "595g perak"}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {nisabType === "gold" ? "Emas" : "Perak"} Rp {metalPrice.toLocaleString("id-ID")}/gr · {priceMeta.source === "online" ? "online" : priceMeta.source === "manual" ? "manual" : "default"} · {priceMeta.date}
                    </p>
                  </div>

                  <NisabSettings
                    nisabType={nisabType}
                    setNisabType={setNisabType}
                    goldInput={goldInput}
                    silverInput={silverInput}
                    onGoldChange={handleGoldChange}
                    onSilverChange={handleSilverChange}
                    onRefresh={refreshGoldPrice}
                    refreshing={refreshing}
                    priceMeta={priceMeta}
                    roundUp={roundUp}
                    onRoundUpChange={(v) => { setRoundUp(v); saveRoundUp(v); }}
                    mazhab={mazhab}
                    onMazhabChange={handleMazhabChange}
                  />

                  {/* Haul reminder (moved here to keep the home clean) */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <CalendarClock className="h-4 w-4 text-primary" /> Pengingat Haul
                    </h3>
                    <HaulReminder embedded />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Info: go straight to the full guide page (no popup) */}
            <Button asChild variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Panduan Zakat">
              <Link to="/panduan-zakat"><Info className="h-5 w-5" /></Link>
            </Button>

            <DarkModeToggle />
          </div>
        </div>
      </header>


      {/* Pull-to-refresh indicator (mobile) */}
      {isMobile && (pullDistance > 0 || refreshing) && (
        <div className="flex items-center justify-center text-xs text-muted-foreground overflow-hidden" style={{ height: refreshing ? 48 : pullDistance }}>
          <div className="flex items-center gap-2">
            <Loader2 className={`h-4 w-4 ${refreshing || pullDistance > 60 ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Memuat harga emas..." : pullDistance > 60 ? "Lepas untuk refresh" : "Tarik untuk refresh"}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <main
        ref={mainRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="mx-auto max-w-2xl w-full px-4 py-5 sm:px-6 sm:py-8 space-y-5 sm:space-y-7 flex-1"
        style={{ paddingBottom: "calc(12rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Desktop nav — same structure as mobile: 4 primary + Lainnya */}
        <nav aria-label="Kategori zakat" className="hidden md:flex flex-wrap gap-1.5">
          {PRIMARY_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab] ?? Briefcase;
            const active = activeTab === tab;
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={active ? "page" : undefined} className={desktopPill(active)}>
                <Icon aria-hidden="true" className="h-4 w-4" /> {labelForTab(tab)}
              </button>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-current={moreActive ? "page" : undefined} className={desktopPill(moreActive)}>
            <LayoutGrid aria-hidden="true" className="h-4 w-4" /> {moreActive ? `Lainnya · ${labelForTab(activeTab)}` : "Lainnya"}
          </button>
        </nav>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg border-border/60">
            <CardContent className="px-4 pt-4 sm:px-6 sm:pt-5">
              <div className="mb-1">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  {activePage?.h1 ?? "Kalkulator Zakat"}
                </h1>
                {activePage?.intro && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{activePage.intro}</p>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="mt-3"
                >
                  {renderCalc(activeTab)}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy reassurance */}
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
          Perhitungan 100% di perangkat Anda — tidak ada data yang dikirim.
        </p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <ZakatRiwayat history={history} onChanged={refreshHistory} />
        </motion.div>

        {/* Per-route SEO content — visually distinct (tinted bg + serif type) */}
        {activePage && activePage.sections.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-secondary p-5 sm:p-6 font-serif space-y-4">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Tentang {activePage.h1.replace("Kalkulator ", "")}
            </h2>
            <div className="space-y-3">
              {activePage.sections.map((s) => (
                <article key={s.heading} className="rounded-xl bg-card border border-border/50 p-4">
                  <h3 className="font-bold text-foreground mb-1.5">{s.heading}</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{s.body}</p>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-1 text-sm font-sans">
              <Link to="/panduan-zakat" className="font-semibold text-primary hover:underline">Panduan lengkap zakat →</Link>
              <Link to="/tentang" className="font-medium text-muted-foreground hover:text-foreground">Tentang & disclaimer</Link>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Tab Navigation (mobile) — same set as desktop: 4 primary + Lainnya */}
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
            <span className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${moreActive ? "bg-primary-foreground" : "group-hover:bg-primary-foreground/10"}`}>
              <LayoutGrid aria-hidden="true" strokeWidth={2.25} className={`h-6 w-6 ${moreActive ? "text-primary" : "text-primary-foreground"}`} />
            </span>
            <span className={`text-[11px] font-semibold ${moreActive ? "text-primary-foreground" : "text-primary-foreground/90"}`}>Lainnya</span>
          </button>
        </div>
      </nav>

      {/* Shared "Lainnya" drawer — opened from both desktop pill and mobile bar */}
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
                <button
                  key={p.tab}
                  type="button"
                  onClick={() => { setActiveTab(p.tab); setMoreOpen(false); }}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"}`}
                >
                  <Icon aria-hidden="true" className={`h-6 w-6 ${active ? "text-primary" : "text-foreground"}`} />
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
    </RoundUpContext.Provider>
  );
};

export default Index;
