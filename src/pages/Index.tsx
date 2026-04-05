import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchGoldPrice, getHistory, formatRupiah, type GoldPrice } from "@/lib/zakat";
import ZakatPenghasilan from "@/components/ZakatPenghasilan";
import ZakatMaal from "@/components/ZakatMaal";
import ZakatFitrah from "@/components/ZakatFitrah";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import ZakatRiwayat from "@/components/ZakatRiwayat";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [goldPrice, setGoldPrice] = useState(1_200_000);
  const [goldInput, setGoldInput] = useState("");
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

  const refreshHistory = useCallback(() => setHistory(getHistory()), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Kalkulator Zakat</h1>
          <DarkModeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8 space-y-4 sm:space-y-6">
        {/* Gold Price Input */}
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap shrink-0">Harga Emas /g</Label>
          <Input
            type="number"
            value={goldInput}
            onChange={(e) => handleGoldChange(e.target.value)}
            className="h-8 text-xs max-w-[180px]"
            placeholder="1200000"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardContent className="px-4 pt-4 sm:px-6 sm:pt-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="penghasilan" className="flex-1 text-xs sm:text-sm">Penghasilan</TabsTrigger>
                  <TabsTrigger value="maal" className="flex-1 text-xs sm:text-sm">Maal</TabsTrigger>
                  <TabsTrigger value="fitrah" className="flex-1 text-xs sm:text-sm">Fitrah</TabsTrigger>
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
                      <ZakatPenghasilan goldPrice={goldPrice} onCalculated={refreshHistory} />
                    </TabsContent>
                    <TabsContent value="maal" forceMount={activeTab === "maal" ? true : undefined} className={activeTab !== "maal" ? "hidden" : ""}>
                      <ZakatMaal goldPrice={goldPrice} onCalculated={refreshHistory} />
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
          <Card>
            <CardContent className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
              <h2 className="text-sm font-semibold mb-2">Panduan Zakat</h2>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="apa">
                  <AccordionTrigger className="text-xs sm:text-sm py-2">Apa Itu Zakat?</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Rukun Islam ke-4: kewajiban mengeluarkan sebagian harta bagi Muslim yang memenuhi syarat, untuk membersihkan harta dan membantu yang membutuhkan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="syarat">
                  <AccordionTrigger className="text-xs sm:text-sm py-2">Syarat Wajib</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Muslim, baligh, berakal</li>
                      <li>Harta mencapai nisab (setara 85g emas)</li>
                      <li>Harta dimiliki penuh selama 1 tahun hijriyah (haul)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="jenis">
                  <AccordionTrigger className="text-xs sm:text-sm py-2">Jenis Zakat</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    <ul className="list-disc list-inside space-y-0.5">
                      <li><span className="font-medium text-foreground">Fitrah</span> — 2,5 kg makanan pokok/jiwa, sebelum Idul Fitri</li>
                      <li><span className="font-medium text-foreground">Maal</span> — 2,5% dari harta yang mencapai nisab & haul</li>
                      <li><span className="font-medium text-foreground">Penghasilan</span> — 2,5% dari pendapatan jika total setahun ≥ nisab</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="asnaf">
                  <AccordionTrigger className="text-xs sm:text-sm py-2">8 Penerima Zakat (Asnaf)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fi Sabilillah, Ibnu Sabil (QS. At-Taubah: 60).
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
