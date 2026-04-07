import { useEffect, useState, useCallback } from "react";
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
import { Calculator, ExternalLink } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Index = () => {
  const [goldPrice, setGoldPrice] = useState(1_200_000);
  const [goldInput, setGoldInput] = useState("");
  const [silverPrice, setSilverPrice] = useState(DEFAULT_SILVER_PRICE);
  const [silverInput, setSilverInput] = useState(String(DEFAULT_SILVER_PRICE));
  const [nisabType, setNisabType] = useState<NisabType>("gold");
  const [history, setHistory] = useState(getHistory());
  const [activeTab, setActiveTab] = useState("penghasilan");

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Zakat<span className="text-primary">Cal</span>
            </h1>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl w-full px-4 py-5 sm:px-6 sm:py-8 space-y-5 sm:space-y-7 flex-1">
        {/* Nisab Type & Metal Prices */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm text-muted-foreground font-medium shrink-0">Standar Nisab</Label>
            <ToggleGroup
              type="single"
              value={nisabType}
              onValueChange={(v) => v && setNisabType(v as NisabType)}
              className="gap-0 rounded-lg border border-border/60 p-0.5"
            >
              <ToggleGroupItem value="gold" className="text-xs sm:text-sm px-3 h-8 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
                🥇 Emas (85g)
              </ToggleGroupItem>
              <ToggleGroupItem value="silver" className="text-xs sm:text-sm px-3 h-8 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
                🥈 Perak (595g)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap shrink-0 font-medium">Emas /g</Label>
              <Input
                type="number"
                value={goldInput}
                onChange={(e) => handleGoldChange(e.target.value)}
                className="h-9 text-sm w-[140px] font-semibold"
                placeholder="1200000"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap shrink-0 font-medium">Perak /g</Label>
              <Input
                type="number"
                value={silverInput}
                onChange={(e) => handleSilverChange(e.target.value)}
                className="h-9 text-sm w-[140px] font-semibold"
                placeholder="15000"
              />
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg border-border/60">
            <CardContent className="px-4 pt-4 sm:px-6 sm:pt-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="penghasilan" className="flex-1 text-xs sm:text-sm font-semibold">Penghasilan</TabsTrigger>
                  <TabsTrigger value="maal" className="flex-1 text-xs sm:text-sm font-semibold">Maal</TabsTrigger>
                  <TabsTrigger value="fitrah" className="flex-1 text-xs sm:text-sm font-semibold">Fitrah</TabsTrigger>
                </TabsList>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <TabsContent value="penghasilan" forceMount={activeTab === "penghasilan" ? true : undefined} className={activeTab !== "penghasilan" ? "hidden" : ""}>
                      <ZakatPenghasilan metalPrice={metalPrice} nisabType={nisabType} onCalculated={refreshHistory} />
                    </TabsContent>
                    <TabsContent value="maal" forceMount={activeTab === "maal" ? true : undefined} className={activeTab !== "maal" ? "hidden" : ""}>
                      <ZakatMaal goldPrice={goldPrice} silverPrice={silverPrice} nisabType={nisabType} onCalculated={refreshHistory} />
                    </TabsContent>
                    <TabsContent value="fitrah" forceMount={activeTab === "fitrah" ? true : undefined} className={activeTab !== "fitrah" ? "hidden" : ""}>
                      <ZakatFitrah onCalculated={refreshHistory} />
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

        {/* Panduan Zakat - Inline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="border-border/60">
            <CardContent className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
              <h2 className="text-base font-bold mb-2">Panduan Zakat</h2>
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
                    <p className="mt-1.5">Sebagian ulama merekomendasikan standar perak agar lebih banyak yang terkena kewajiban zakat.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="asnaf">
                  <AccordionTrigger className="text-sm sm:text-base py-2 font-semibold">8 Penerima Zakat (Asnaf)</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fi Sabilillah, Ibnu Sabil (QS. At-Taubah: 60).
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
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
    </div>
  );
};

export default Index;
