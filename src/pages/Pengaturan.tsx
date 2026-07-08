import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import HaulReminder from "@/components/HaulReminder";
import { toast } from "sonner";
import {
  fetchGoldPrice,
  loadStoredPrices,
  saveStoredPrices,
  loadRoundUp,
  saveRoundUp,
  getNisab,
  formatRupiah,
  type NisabType,
  type PriceSource,
} from "@/lib/zakat";
import { formattedChange, formatQuantityInput, parseQuantity, formatMetalPrice } from "@/lib/format";
import { useSeo, SITE_URL } from "@/lib/seo";

export default function Pengaturan() {
  useSeo({
    title: "Pengaturan — ZakatCal",
    description:
      "Atur standar nisab, harga emas/perak per gram, pembulatan zakat, dan pengingat haul di ZakatCal.",
    path: "/pengaturan",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Pengaturan ZakatCal",
      url: `${SITE_URL}/pengaturan`,
    },
  });

  const stored = loadStoredPrices();
  const [goldPrice, setGoldPrice] = useState(stored.gold);
  const [goldInput, setGoldInput] = useState(formatMetalPrice(stored.gold));
  const [silverPrice, setSilverPrice] = useState(stored.silver);
  const [silverInput, setSilverInput] = useState(formatMetalPrice(stored.silver));
  const [priceMeta, setPriceMeta] = useState<{ date: string; source: PriceSource }>({
    date: stored.date,
    source: stored.source,
  });
  const [nisabType, setNisabType] = useState<NisabType>("gold");
  const [roundUp, setRoundUp] = useState(() => loadRoundUp());
  const [refreshing, setRefreshing] = useState(false);

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
        toast.error("Gagal memuat harga online", { description: "Isi manual bila perlu." });
      } else {
        setGoldPrice(g.price);
        setGoldInput(formatQuantityInput(String(g.price), 2));
        persistPrices(g.price, silverPrice, "online");
        toast.success("Harga emas diperbarui", {
          description: `Rp ${formatMetalPrice(g.price)} / gram`,
        });
      }
    } catch {
      toast.error("Gagal memuat harga emas");
    } finally {
      setRefreshing(false);
    }
  }, [silverPrice, persistPrices]);

  // Auto-fetch once on mount (auto-update is always on).
  const autoFetchedRef = useRef(false);
  useEffect(() => {
    if (autoFetchedRef.current) return;
    autoFetchedRef.current = true;
    refreshGoldPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formattedChange(e, setGoldInput, (v) => formatQuantityInput(v, 2));
    const num = parseQuantity(e.target.value);
    if (num > 0) {
      setGoldPrice(num);
      persistPrices(num, silverPrice, "manual");
    }
  };
  const handleSilverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formattedChange(e, setSilverInput, (v) => formatQuantityInput(v, 2));
    const num = parseQuantity(e.target.value);
    if (num > 0) {
      setSilverPrice(num);
      persistPrices(goldPrice, num, "manual");
    }
  };

  const metalPrice = nisabType === "gold" ? goldPrice : silverPrice;
  const currentNisab = getNisab(metalPrice, nisabType);

  return (
    <div className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Pengaturan</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Atur nisab, harga logam, dan pengingat haul.</p>
        </div>

        <Card>
          <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
            <CardTitle className="text-base sm:text-lg">Nisab saat ini</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5 space-y-1">
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatRupiah(currentNisab)}
              <span className="text-muted-foreground text-xs font-normal sm:text-sm">
                {" "}· {nisabType === "gold" ? "85g emas" : "595g perak"}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              {nisabType === "gold" ? "Emas" : "Perak"} Rp {formatMetalPrice(metalPrice)}/gr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5"><CardTitle className="text-base sm:text-lg">Standar Nisab</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
            <ToggleGroup
              type="single"
              value={nisabType}
              onValueChange={(v) => v && setNisabType(v as NisabType)}
              className="w-full gap-0 rounded-lg border border-border/60 p-0.5"
            >
              <ToggleGroupItem value="gold" className="flex-1 text-xs h-9 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold sm:text-sm sm:h-10">
                Emas (85g)
              </ToggleGroupItem>
              <ToggleGroupItem value="silver" className="flex-1 text-xs h-9 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold sm:text-sm sm:h-10">
                Perak (595g)
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5"><CardTitle className="text-base sm:text-lg">Harga Logam per Gram</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="gold-price" className="text-xs text-muted-foreground font-medium sm:text-sm">
                  Harga Emas per gram (Rp)
                </Label>
                <Button variant="outline" size="sm" onClick={refreshGoldPrice} disabled={refreshing} className="h-7 text-[11px] sm:h-8 sm:text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Perbarui
                </Button>
              </div>
              <Input
                id="gold-price"
                type="text"
                inputMode="decimal"
                value={goldInput}
                onChange={handleGoldChange}
                className="h-10 text-sm font-semibold sm:h-12 sm:text-base"
                placeholder="2.000.000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="silver-price" className="text-xs text-muted-foreground font-medium sm:text-sm">
                Harga Perak per gram (Rp)
              </Label>
              <Input
                id="silver-price"
                type="text"
                inputMode="decimal"
                value={silverInput}
                onChange={handleSilverChange}
                className="h-10 text-sm font-semibold sm:h-12 sm:text-base"
                placeholder="28.000"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5"><CardTitle className="text-base sm:text-lg">Pembulatan Zakat</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label htmlFor="roundup-switch" className="text-xs font-medium sm:text-sm">Bulatkan zakat ke atas</Label>
                <p className="text-[10px] text-muted-foreground sm:text-[11px]">Pembulatan ihtiyat ke Rp 1.000 terdekat.</p>
              </div>
              <Switch
                id="roundup-switch"
                checked={roundUp}
                onCheckedChange={(v) => { setRoundUp(v); saveRoundUp(v); }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Pengingat Haul
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
            <HaulReminder embedded />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
