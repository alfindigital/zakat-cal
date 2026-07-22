import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [goldError, setGoldError] = useState<string | null>(null);
  const [silverPrice, setSilverPrice] = useState(stored.silver);
  const [silverInput, setSilverInput] = useState(formatMetalPrice(stored.silver));
  const [silverError, setSilverError] = useState<string | null>(null);
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

  const refreshGoldPrice = useCallback(async (silent = false) => {
    setRefreshing(true);
    try {
      const g = await fetchGoldPrice();
      if (g.isDefault) {
        toast.error("Gagal memuat harga online", { description: "Isi manual bila perlu." });
      } else {
        setGoldPrice(g.price);
        setGoldInput(formatMetalPrice(g.price));
        setGoldError(null);
        persistPrices(g.price, silverPrice, "online");
        if (!silent) {
          toast.success("Harga emas diperbarui", {
            description: `Rp ${formatMetalPrice(g.price)} / gram`,
          });
        }
      }
    } catch {
      toast.error("Gagal memuat harga emas");
    } finally {
      setRefreshing(false);
    }
  }, [silverPrice, persistPrices]);

  // Auto-fetch once on mount (silent: no repeated toast).
  const autoFetchedRef = useRef(false);
  useEffect(() => {
    if (autoFetchedRef.current) return;
    autoFetchedRef.current = true;
    refreshGoldPrice(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateMetalPrice = (value: string, label: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} wajib diisi.`;
    const num = parseQuantity(trimmed);
    if (Number.isNaN(num)) return `${label} harus berupa angka.`;
    if (num <= 0) return `${label} harus lebih dari 0.`;
    return null;
  };

  const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formattedChange(e, setGoldInput, (v) => formatQuantityInput(v, 2));
    const err = validateMetalPrice(e.target.value, "Harga emas");
    setGoldError(err);
    if (!err) {
      const num = parseQuantity(e.target.value);
      setGoldPrice(num);
      persistPrices(num, silverPrice, "manual");
    }
  };
  const handleSilverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formattedChange(e, setSilverInput, (v) => formatQuantityInput(v, 2));
    const err = validateMetalPrice(e.target.value, "Harga perak");
    setSilverError(err);
    if (!err) {
      const num = parseQuantity(e.target.value);
      setSilverPrice(num);
      persistPrices(goldPrice, num, "manual");
    }
  };

  const metalPrice = nisabType === "gold" ? goldPrice : silverPrice;
  const currentNisab = getNisab(metalPrice, nisabType);

  return (
    <main
      className="mx-auto max-w-lg w-full px-4 py-6 sm:px-6 sm:py-8 flex-1 space-y-6"
      style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >



      {/* Hero Nisab Card */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/25">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/80">
                Nisab saat ini
              </p>
              <Coins className="h-6 w-6 text-primary-foreground/40" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-2xl font-bold tabular-nums sm:text-3xl">
                {formatRupiah(currentNisab)}
              </h2>
              <span className="text-sm font-light text-primary-foreground/80">
                / {nisabType === "gold" ? "85g emas" : "595g perak"}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-tight text-primary-foreground/70">
              {nisabType === "gold" ? "Emas" : "Perak"} Rp {formatMetalPrice(metalPrice)}/gr
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
        </div>

        {/* Main Settings Container */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {/* Standar Nisab */}
          <div className="p-5 sm:p-6">
            <Label className="mb-4 block text-sm font-semibold text-card-foreground">
              Standar Nisab
            </Label>
            <ToggleGroup
              type="single"
              value={nisabType}
              onValueChange={(v) => v && setNisabType(v as NisabType)}
              className="flex w-full gap-1 rounded-xl bg-muted p-1"
            >
              <ToggleGroupItem
                value="gold"
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all data-[state=on]:bg-card data-[state=on]:text-primary data-[state=on]:shadow-sm"
              >
                Emas (85g)
              </ToggleGroupItem>
              <ToggleGroupItem
                value="silver"
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-all hover:text-card-foreground data-[state=on]:bg-card data-[state=on]:text-primary data-[state=on]:shadow-sm"
              >
                Perak (595g)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Harga Logam */}
          <div className="border-t border-border p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <Label className="text-sm font-semibold text-card-foreground">
                Harga Logam per Gram
              </Label>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refreshGoldPrice()}
                disabled={refreshing}
                aria-label="Perbarui harga emas"
                className="h-8 w-8 rounded-full border-primary/10 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="gold-price"
                    type="text"
                    inputMode="decimal"
                    value={goldInput}
                    onChange={handleGoldChange}
                    aria-invalid={goldError ? true : undefined}
                    aria-describedby={goldError ? "gold-price-error" : undefined}
                    className="h-12 border-border bg-muted pl-12 pr-4 text-base font-medium text-card-foreground placeholder:text-muted-foreground/60 transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                    placeholder="2.000.000"
                  />
                  <Label
                    htmlFor="gold-price"
                    className="absolute -top-2 left-3 bg-card px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Harga Emas
                  </Label>
                </div>
                {goldError && (
                  <p id="gold-price-error" role="alert" className="text-xs text-destructive">
                    {goldError}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="silver-price"
                    type="text"
                    inputMode="decimal"
                    value={silverInput}
                    onChange={handleSilverChange}
                    aria-invalid={silverError ? true : undefined}
                    aria-describedby={silverError ? "silver-price-error" : undefined}
                    className="h-12 border-border bg-muted pl-12 pr-4 text-base font-medium text-card-foreground placeholder:text-muted-foreground/60 transition-shadow focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                    placeholder="28.000"
                  />
                  <Label
                    htmlFor="silver-price"
                    className="absolute -top-2 left-3 bg-card px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Harga Perak
                  </Label>
                </div>
                {silverError && (
                  <p id="silver-price-error" role="alert" className="text-xs text-destructive">
                    {silverError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pembulatan Zakat */}
          <div className="border-t border-border p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="roundup-switch" className="text-sm font-semibold text-card-foreground">
                  Pembulatan Zakat
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bulatkan zakat ke Rp 1.000 terdekat
                </p>
              </div>
              <Switch
                id="roundup-switch"
                checked={roundUp}
                onCheckedChange={(v) => { setRoundUp(v); saveRoundUp(v); }}
              />
            </div>
          </div>

          {/* Pengingat Haul */}
          <div className="border-t border-border p-5 sm:p-6">
            <HaulReminder embedded />
          </div>
        </div>
    </main>
  );
}

