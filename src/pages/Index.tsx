import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchGoldPrice,
  getHistory,
  subscribeHistory,
  loadStoredPrices,
  saveStoredPrices,
  loadRoundUp,
  getNisab,
  formatRupiah,
  migrateStorage,
  decodeSharedResult,
  type NisabType,
  type PriceSource,
} from "@/lib/zakat";
import { getHaulReminders, haulEndDate, daysUntil } from "@/lib/haul";
import { RoundUpContext } from "@/lib/round-context";
import ZakatMaal from "@/components/ZakatMaal";
import ZakatFitrah from "@/components/ZakatFitrah";
import ZakatPerniagaan from "@/components/ZakatPerniagaan";
import ZakatPertanian from "@/components/ZakatPertanian";
import ZakatPeternakan from "@/components/ZakatPeternakan";
import ZakatRikaz from "@/components/ZakatRikaz";
import ZakatMadin from "@/components/ZakatMadin";
import ZakatFidyah from "@/components/ZakatFidyah";

import ZakatRiwayat from "@/components/ZakatRiwayat";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { ALL_PAGES, HOME_SEO, getPageBySlug, useSeo, type ZakatPage } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { formatMetalPrice } from "@/lib/format";
import { TAB_ICONS, pathForTab, tabForPath as tabForPathShared } from "@/components/AppShell";


const tabForPath = (pathname: string) => tabForPathShared(pathname) ?? "maal";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stored = useMemo(() => loadStoredPrices(), []);
  const [goldPrice, setGoldPrice] = useState(stored.gold);
  const [silverPrice] = useState(stored.silver);
  const [priceMeta, setPriceMeta] = useState<{ date: string; source: PriceSource }>({ date: stored.date, source: stored.source });
  const [nisabType] = useState<NisabType>("gold");
  const [roundUp] = useState(() => loadRoundUp());
  const [history, setHistory] = useState(getHistory());
  

  const [refreshing, setRefreshing] = useState(false);

  // Prefill delivered from the /riwayat "Edit ulang" flow via router state.
  // Snapshot on first render so the calculator's lazy state initialiser sees
  // it, then strip the state so navigation/refresh doesn't re-apply it.
  const [prefill] = useState<Record<string, unknown> | undefined>(() => {
    const s = (location.state as { prefill?: Record<string, unknown> } | null)?.prefill;
    return s && typeof s === "object" ? s : undefined;
  });
  useEffect(() => {
    if (prefill) {
      toast.info("Data riwayat dimuat", {
        description: "Silakan sesuaikan lalu simpan ulang.",
      });
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const refreshGoldPrice = useCallback(async (silent = false) => {
    setRefreshing(true);
    try {
      const g = await fetchGoldPrice();
      if (g.isDefault) {
        toast.error("Gagal memuat harga online", { description: "Memakai harga tersimpan." });
      } else {
        setGoldPrice(g.price);
        persistPrices(g.price, silverPrice, "online");
        if (!silent) {
          toast.success("Harga emas diperbarui", { description: `Rp ${formatMetalPrice(g.price)} / gram` });
        }
      }
    } catch {
      toast.error("Gagal memuat harga emas");
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [silverPrice, persistPrices]);


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

  // Always auto-fetch latest gold price on mount (silent: no repeated toast).
  const autoFetchedRef = useRef(false);
  useEffect(() => {
    if (autoFetchedRef.current) return;
    autoFetchedRef.current = true;
    refreshGoldPrice(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Only forward prefill to the tab that matches the incoming history entry.
    const p = isActive ? prefill : undefined;
    switch (tab) {
      case "maal":
        return <ZakatMaal goldPrice={goldPrice} silverPrice={silverPrice} nisabType={nisabType} isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "perniagaan":
        return <ZakatPerniagaan goldPrice={goldPrice} isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "pertanian":
        return <ZakatPertanian isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "peternakan":
        return <ZakatPeternakan isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "rikaz":
        return <ZakatRikaz isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "madin":
        return <ZakatMadin goldPrice={goldPrice} isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "fitrah":
        return <ZakatFitrah isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      case "fidyah":
        return <ZakatFidyah isActive={isActive} onCalculated={refreshHistory} prefill={p} />;
      default:
        return null;
    }
  };


  // Desktop nav: show all zakat categories as individual pills (no "Lainnya" grouping).
  // Tablet (md): icon-only pills so all categories fit in one row.
  // Desktop (lg+): icon + label.
  const desktopPill = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 rounded-lg px-0 md:w-10 lg:w-auto lg:px-4 h-9 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex-1 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`;

  const pullToRefreshSlot = isMobile && (pullDistance > 0 || refreshing) ? (
    <div className="flex items-center justify-center text-xs text-muted-foreground overflow-hidden" style={{ height: refreshing ? 48 : pullDistance }}>
      <div className="flex items-center gap-2">
        <Loader2 className={`h-4 w-4 ${refreshing || pullDistance > 60 ? "animate-spin" : ""}`} />
        <span>{refreshing ? "Memuat harga emas..." : pullDistance > 60 ? "Lepas untuk refresh" : "Tarik untuk refresh"}</span>
      </div>
    </div>
  ) : null;

  return (
    <RoundUpContext.Provider value={roundUp}>
      <main
        ref={mainRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="mx-auto max-w-2xl w-full px-4 py-3 sm:px-5 sm:py-4 md:py-8 md:px-8 md:max-w-7xl flex-1"
        style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {pullToRefreshSlot}

          <nav aria-label="Kategori zakat" className="hidden md:flex md:flex-nowrap md:gap-2 lg:gap-3 justify-center w-full md:mb-6">
            {ALL_PAGES.map((page) => {
              const Icon = TAB_ICONS[page.tab] ?? Briefcase;
              const active = activeTab === page.tab;
              return (
                <button key={page.tab} type="button" onClick={() => setActiveTab(page.tab)} aria-current={active ? "page" : undefined} aria-label={page.label} title={page.label} className={desktopPill(active)}>
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{page.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg border-border/60">
              <CardContent className="px-4 pt-4 sm:px-5 sm:pt-5 pb-4 sm:pb-5">
                <div className="mb-1 md:mb-2">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
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
                    className="mt-2 md:mt-3"
                  >
                    {renderCalc(activeTab)}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <ZakatRiwayat history={history} onChanged={refreshHistory} />
          </motion.div>

          {activePage && activePage.sections.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-secondary p-3.5 sm:p-4 md:p-5 space-y-2 md:space-y-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
                Tentang {activePage.h1.replace("Kalkulator ", "")}
              </h2>
              <div className="space-y-1.5 md:space-y-2">
                {activePage.sections.map((s) => (
                  <article key={s.heading} className="rounded-xl bg-card border border-border/50 p-3 md:p-4">
                    <h3 className="font-bold text-foreground mb-0.5 md:mb-1 text-sm sm:text-base">{s.heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
      </div>
      </main>
    </RoundUpContext.Provider>
  );

};

export default Index;
