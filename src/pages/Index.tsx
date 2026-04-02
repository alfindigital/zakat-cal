import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchGoldPrice, getHistory, type GoldPrice } from "@/lib/zakat";
import ZakatPenghasilan from "@/components/ZakatPenghasilan";
import ZakatMaal from "@/components/ZakatMaal";
import ZakatFitrah from "@/components/ZakatFitrah";
import ZakatRiwayat from "@/components/ZakatRiwayat";

const Index = () => {
  const [gold, setGold] = useState<GoldPrice | null>(null);
  const [history, setHistory] = useState(getHistory());

  useEffect(() => {
    fetchGoldPrice().then(setGold);
  }, []);

  const refreshHistory = useCallback(() => setHistory(getHistory()), []);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kalkulator Zakat</h1>
          <p className="text-muted-foreground">Hitung zakat penghasilan, maal, dan fitrah dengan mudah</p>
          {gold && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Harga emas: {new Intl.NumberFormat("id-ID").format(gold.price)}/gram</span>
              {gold.isDefault && <Badge variant="secondary" className="text-[10px]">estimasi</Badge>}
            </div>
          )}
        </div>

        {/* Calculator Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pilih Jenis Zakat</CardTitle>
            <CardDescription>Masukkan data untuk menghitung zakat Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="penghasilan">
              <TabsList className="w-full">
                <TabsTrigger value="penghasilan" className="flex-1">Penghasilan</TabsTrigger>
                <TabsTrigger value="maal" className="flex-1">Maal</TabsTrigger>
                <TabsTrigger value="fitrah" className="flex-1">Fitrah</TabsTrigger>
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
      </div>
    </div>
  );
};

export default Index;
