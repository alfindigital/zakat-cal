import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchGoldPrice, getHistory, type GoldPrice } from "@/lib/zakat";
import ZakatPenghasilan from "@/components/ZakatPenghasilan";
import ZakatMaal from "@/components/ZakatMaal";
import ZakatFitrah from "@/components/ZakatFitrah";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import ZakatRiwayat from "@/components/ZakatRiwayat";
import { motion, AnimatePresence } from "framer-motion";

const tabContent = {
  penghasilan: "penghasilan",
  maal: "maal",
  fitrah: "fitrah",
} as const;

const Index = () => {
  const [gold, setGold] = useState<GoldPrice | null>(null);
  const [history, setHistory] = useState(getHistory());
  const [activeTab, setActiveTab] = useState("penghasilan");

  useEffect(() => {
    fetchGoldPrice().then(setGold);
  }, []);

  const refreshHistory = useCallback(() => setHistory(getHistory()), []);

  return (
    <div className="min-h-screen bg-background px-3 py-6 sm:px-4 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-start justify-between gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Kalkulator Zakat</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Hitung zakat dengan mudah</span>
              {gold && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="hidden sm:inline"
                >
                  · Emas {new Intl.NumberFormat("id-ID").format(gold.price)}/g
                  {gold.isDefault && <Badge variant="secondary" className="ml-1 text-[10px]">est</Badge>}
                </motion.span>
              )}
            </div>
          </div>
          <DarkModeToggle />
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="px-4 pb-2 sm:px-6 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Pilih Jenis Zakat</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Masukkan data untuk menghitung zakat Anda</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="penghasilan" className="flex-1 text-xs sm:text-sm transition-all duration-200">Penghasilan</TabsTrigger>
                  <TabsTrigger value="maal" className="flex-1 text-xs sm:text-sm transition-all duration-200">Maal</TabsTrigger>
                  <TabsTrigger value="fitrah" className="flex-1 text-xs sm:text-sm transition-all duration-200">Fitrah</TabsTrigger>
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
                      <ZakatPenghasilan goldPrice={gold?.price ?? 1_200_000} onCalculated={refreshHistory} />
                    </TabsContent>
                    <TabsContent value="maal" forceMount={activeTab === "maal" ? true : undefined} className={activeTab !== "maal" ? "hidden" : ""}>
                      <ZakatMaal goldPrice={gold?.price ?? 1_200_000} onCalculated={refreshHistory} />
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

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ZakatRiwayat history={history} onChanged={refreshHistory} />
        </motion.div>

        <motion.div
          className="text-center pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <Link to="/panduan" className="text-sm text-primary hover:underline transition-colors duration-200">
            📖 Baca Panduan Zakat
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
