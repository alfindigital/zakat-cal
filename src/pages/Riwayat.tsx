import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, History } from "lucide-react";
import { getHistory, subscribeHistory } from "@/lib/zakat";
import ZakatRiwayat from "@/components/ZakatRiwayat";
import { useSeo } from "@/lib/seo";

export default function RiwayatPage() {
  const [history, setHistory] = useState(getHistory());
  const refresh = useCallback(() => setHistory(getHistory()), []);
  useEffect(() => subscribeHistory(refresh), [refresh]);

  useSeo({
    title: "Riwayat Perhitungan Zakat — ZakatCal",
    description:
      "Lihat, buka detail, dan edit ulang seluruh perhitungan zakat Anda yang tersimpan di ZakatCal.",
    path: "/riwayat",
  });

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button asChild variant="ghost" size="icon" className="h-10 w-10" aria-label="Kembali ke beranda">
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight truncate">
                Riwayat Perhitungan
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl w-full px-4 py-5 sm:px-6 sm:py-8 flex-1 space-y-5">
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <History className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Belum ada riwayat</p>
              <p className="text-sm text-muted-foreground mt-1">
                Perhitungan yang Anda simpan akan tampil di sini. Buka detail atau edit ulang perhitungan sebelumnya kapan saja.
              </p>
            </div>
            <Button asChild>
              <Link to="/">
                <Calculator className="h-4 w-4 mr-2" />
                Mulai Hitung Zakat
              </Link>
            </Button>
          </div>
        ) : (
          <ZakatRiwayat history={history} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}
