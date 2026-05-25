import { useEffect, useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchGoldPrice, getHistory, DEFAULT_SILVER_PRICE, type NisabType } from "@/lib/zakat";
import ZakatPenghasilan from "@/components/ZakatPenghasilan";
import ZakatMaal from "@/components/ZakatMaal";
import ZakatFitrah from "@/components/ZakatFitrah";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import ZakatRiwayat from "@/components/ZakatRiwayat";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ExternalLink, Briefcase, Wallet, Wheat, Settings2, Menu, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const NisabSettings = ({
  nisabType,
  setNisabType,
  goldInput,
  silverInput,
  onGoldChange,
  onSilverChange,
}: {
  nisabType: NisabType;
  setNisabType: (v: NisabType) => void;
  goldInput: string;
  silverInput: string;
  onGoldChange: (v: string) => void;
  onSilverChange: (v: string) => void;
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground font-medium">Standar Nisab</Label>
      <ToggleGroup
        type="single"
        value={nisabType}
        onValueChange={(v) => v && setNisabType(v as NisabType)}
        className="w-full gap-0 rounded-lg border border-border/60 p-0.5"
      >
        <ToggleGroupItem value="gold" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
          🥇 Emas (85g)
        </ToggleGroupItem>
        <ToggleGroupItem value="silver" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
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
        className="h-12 text-base font-semibold"
        placeholder="1200000"
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
        className="h-12 text-base font-semibold"
        placeholder="15000"
      />
    </div>
  </div>
);

const PanduanContent = () => (
  <Accordion type="multiple" className="w-full">
    <AccordionItem value="apa">
      <AccordionTrigger className="text-sm sm:text-base py-2 font-semibold">Apa Itu Zakat?</AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
        Rukun Islam ke-4: kewajiban mengeluarkan sebagian harta bagi Muslim yang memenuhi syarat, untuk membersihkan harta dan membantu yang membutuhkan.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="syarat">
      <AccordionTrigger className="text-sm sm:text-base py-2 font-semibold">Syarat Wajib</AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
        <ul className="list-disc list-inside space-y-0.5">
          <li>Muslim, baligh, berakal</li>
          <li>Harta mencapai nisab (setara 85g emas atau 595g perak)</li>
          <li>Harta dimiliki penuh selama 1 tahun hijriyah (haul)</li>
        </ul>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="jenis">
      <AccordionTrigger className="text-sm sm:text-base py-2 font-semibold">Jenis Zakat</AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
        <ul className="list-disc list-inside space-y-0.5">
          <li><span className="font-semibold text-foreground">Fitrah</span> — 2,5 kg makanan pokok/jiwa, sebelum Idul Fitri</li>
          <li><span className="font-semibold text-foreground">Maal</span> — 2,5% dari harta yang mencapai nisab & haul</li>
          <li><span className="font-semibold text-foreground">Penghasilan</span> — 2,5% dari pendapatan jika total setahun ≥ nisab</li>
        </ul>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="nisab">
      <AccordionTrigger className="text-sm sm:text-base py-2 font-semibold">Nisab Emas vs Perak</AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
        <ul className="list-disc list-inside space-y-0.5">
          <li><span className="font-semibold text-foreground">Emas</span> — 85 gram emas murni (standar mayoritas ulama)</li>
          <li><span className="font-semibold text-foreground">Perak</span> — 595 gram perak murni (nisab lebih rendah, lebih banyak orang wajib zakat)</li>
        </ul>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="asnaf">
      <AccordionTrigger className="text-sm sm:text-base py-2 font-semibold">8 Penerima Zakat (Asnaf)</AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
        Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fi Sabilillah, Ibnu Sabil (QS. At-Taubah: 60).
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

const Index = () => {
  const isMobile = useIsMobile();
  const [goldPrice, setGoldPrice] = useState(1_200_000);
  const [goldInput, setGoldInput] = useState("1200000");
  const [silverPrice, setSilverPrice] = useState(DEFAULT_SILVER_PRICE);
  const [silverInput, setSilverInput] = useState(String(DEFAULT_SILVER_PRICE));
  const [nisabType, setNisabType] = useState<NisabType>("gold");
  const [history, setHistory] = useState(getHistory());
  const [activeTab, setActiveTab] = useState("penghasilan");
  const [nisabSheetOpen, setNisabSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh state
  const mainRef = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const refreshGoldPrice = useCallback(async () => {
    setRefreshing(true);
    try {
      const g = await fetchGoldPrice();
      setGoldPrice(g.price);
      setGoldInput(String(g.price));
      toast.success("Harga emas diperbarui", { description: `Rp ${g.price.toLocaleString("id-ID")} / gram` });
    } catch {
      toast.error("Gagal memuat harga emas");
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, []);

  useEffect(() => {
    fetchGoldPrice().then((g) => {
      setGoldPrice(g.price);
      setGoldInput(String(g.price));
    });
  }, []);

  const handleGoldChange = (val: string) => {
    setGoldInput(val);
    const num = Number(val);
    if (num > 0) setGoldPrice(num);
  };

  const handleSilverChange = (val: string) => {
    setSilverInput(val);
    const num = Number(val);
    if (num > 0) setSilverPrice(num);
  };

  const metalPrice = nisabType === "gold" ? goldPrice : silverPrice;
  const refreshHistory = useCallback(() => setHistory(getHistory()), []);

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

  const TABS = [
    { id: "penghasilan", label: "Penghasilan", short: "Gaji", icon: Briefcase },
    { id: "maal", label: "Maal", short: "Maal", icon: Wallet },
    { id: "fitrah", label: "Fitrah", short: "Fitrah", icon: Wheat },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl truncate">
              Zakat<span className="text-primary">Cal</span>
              <span className="sr-only"> — Kalkulator Zakat Modern</span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Nisab Settings — Bottom Sheet on mobile, popover-ish on desktop */}
            <Sheet open={nisabSheetOpen} onOpenChange={setNisabSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Pengaturan Nisab">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={isMobile ? "bottom" : "right"}
                className={isMobile ? "rounded-t-2xl pb-8" : ""}
              >
                <SheetHeader>
                  <SheetTitle>Pengaturan Nisab</SheetTitle>
                  <SheetDescription className="sr-only">
                    Atur standar nisab dan harga emas atau perak per gram untuk perhitungan zakat.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <NisabSettings
                    nisabType={nisabType}
                    setNisabType={setNisabType}
                    goldInput={goldInput}
                    silverInput={silverInput}
                    onGoldChange={handleGoldChange}
                    onSilverChange={handleSilverChange}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <DarkModeToggle />

            {/* Hamburger menu — mobile */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] sm:max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Akses pengaturan nisab dan panduan singkat tentang zakat.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Pengaturan</h3>
                    <NisabSettings
                      nisabType={nisabType}
                      setNisabType={setNisabType}
                      goldInput={goldInput}
                      silverInput={silverInput}
                      onGoldChange={handleGoldChange}
                      onSilverChange={handleSilverChange}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Panduan Zakat</h3>
                    <PanduanContent />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Pull-to-refresh indicator (mobile) */}
      {isMobile && (pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground overflow-hidden"
          style={{ height: refreshing ? 48 : pullDistance }}
        >
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
        style={{
          paddingBottom: isMobile ? "calc(8.5rem + env(safe-area-inset-bottom, 0px))" : undefined,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg border-border/60">
            <CardContent className="px-4 pt-4 sm:px-6 sm:pt-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Desktop tabs only */}
                <TabsList className="w-full hidden md:flex">
                  <TabsTrigger value="penghasilan" className="flex-1 text-sm font-semibold">Penghasilan</TabsTrigger>
                  <TabsTrigger value="maal" className="flex-1 text-sm font-semibold">Maal</TabsTrigger>
                  <TabsTrigger value="fitrah" className="flex-1 text-sm font-semibold">Fitrah</TabsTrigger>
                </TabsList>

                {/* Mobile active tab label */}
                {isMobile && (
                  <div className="flex items-center justify-between mb-3 -mt-1">
                    <h2 className="text-base font-bold">Zakat {TABS.find((t) => t.id === activeTab)?.label}</h2>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <TabsContent value="penghasilan" forceMount={activeTab === "penghasilan" ? true : undefined} className={activeTab !== "penghasilan" ? "hidden" : ""}>
                      <ZakatPenghasilan metalPrice={metalPrice} nisabType={nisabType} isActive={activeTab === "penghasilan"} onCalculated={refreshHistory} />
                    </TabsContent>
                    <TabsContent value="maal" forceMount={activeTab === "maal" ? true : undefined} className={activeTab !== "maal" ? "hidden" : ""}>
                      <ZakatMaal goldPrice={goldPrice} silverPrice={silverPrice} nisabType={nisabType} isActive={activeTab === "maal"} onCalculated={refreshHistory} />
                    </TabsContent>
                    <TabsContent value="fitrah" forceMount={activeTab === "fitrah" ? true : undefined} className={activeTab !== "fitrah" ? "hidden" : ""}>
                      <ZakatFitrah isActive={activeTab === "fitrah"} onCalculated={refreshHistory} />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <ZakatRiwayat history={history} onChanged={refreshHistory} />
        </motion.div>

        {/* Panduan Zakat — hidden on mobile (in hamburger drawer) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="hidden md:block"
        >
          <Card className="border-border/60">
            <CardContent className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
              <h2 className="text-base font-bold mb-2">Panduan Zakat</h2>
              <PanduanContent />
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer (desktop) */}
      <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm hidden md:block">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span>made by</span>
          <a
            href="https://alfindigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            @alfindigital
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>

      {/* Mobile Bottom Tab Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Navigasi utama"
      >
        <div className="flex items-stretch justify-around h-16">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                aria-current={active ? "page" : undefined}
                aria-label={`Zakat ${t.label}`}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-md"
              >
                <Icon aria-hidden="true" className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[11px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {t.short}
                </span>
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-10 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
