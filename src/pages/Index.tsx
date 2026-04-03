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

const Index = () => {
  const [gold, setGold] = useState<GoldPrice | null>(null);
  const [history, setHistory] = useState(getHistory());

  useEffect(() => {
    fetchGoldPrice().then(setGold);
  }, []);

  const refreshHistory = useCallback(() => setHistory(getHistory()), []);

  return (
    <div className="min-h-screen bg-background px-3 py-6 sm:px-4 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5 sm:space-y-2 relative">
          <div className="absolute right-0 top-0">
            <DarkModeToggle />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl pr-10">Kalkulator Zakat</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Hitung zakat penghasilan, maal, dan fitrah dengan mudah</p>
          {gold && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Harga emas: {new Intl.NumberFormat("id-ID").format(gold.price)}/gram</span>
              {gold.isDefault && <Badge variant="secondary" className="text-[10px]">estimasi</Badge>}
            </div>
          )}
        </div>

        {/* Calculator Card */}
        <Card>
          <CardHeader className="px-4 pb-2 sm:px-6 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Pilih Jenis Zakat</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Masukkan data untuk menghitung zakat Anda</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="penghasilan">
              <TabsList className="w-full">
                <TabsTrigger value="penghasilan" className="flex-1 text-xs sm:text-sm">Penghasilan</TabsTrigger>
                <TabsTrigger value="maal" className="flex-1 text-xs sm:text-sm">Maal</TabsTrigger>
                <TabsTrigger value="fitrah" className="flex-1 text-xs sm:text-sm">Fitrah</TabsTrigger>
              </TabsList>
              <TabsContent value="penghasilan">
                <ZakatPenghasilan goldPrice={gold?.price ?? 1_200_000} onCalculated={refreshHistory} />
              </TabsContent>
              <TabsContent value="maal">
                <ZakatMaal goldPrice={gold?.price ?? 1_200_000} onCalculated={refreshHistory} />
              </TabsContent>
              <TabsContent value="fitrah">
                <ZakatFitrah onCalculated={refreshHistory} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* History */}
        <ZakatRiwayat history={history} onChanged={refreshHistory} />

        <div className="text-center pb-4">
          <Link to="/panduan" className="text-sm text-primary hover:underline">
            📖 Baca Panduan Zakat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
