import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { calcZakatMaal, formatRupiah, addHistory, type NisabType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";

interface Props {
  goldPrice: number;
  silverPrice: number;
  nisabType: NisabType;
  onCalculated: () => void;
}

export default function ZakatMaal({ goldPrice, silverPrice, nisabType, onCalculated }: Props) {
  const [tabungan, setTabungan] = useState("");
  const [emas, setEmas] = useState("");
  const [perak, setPerak] = useState("");
  const [investasi, setInvestasi] = useState("");
  const [properti, setProperti] = useState("");
  const [hutang, setHutang] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatMaal> | null>(null);

  const handleCalc = () => {
    const r = calcZakatMaal(
      Number(tabungan) || 0, Number(emas) || 0, Number(perak) || 0,
      Number(investasi) || 0, Number(properti) || 0, Number(hutang) || 0,
      goldPrice, silverPrice, nisabType
    );
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Maal", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Maal", [
      { label: "Tabungan", value: formatRupiah(Number(tabungan) || 0) },
      { label: "Nilai Emas", value: formatRupiah(result.emasValue) },
      { label: "Nilai Perak", value: formatRupiah(result.perakValue) },
      { label: "Investasi / Saham", value: formatRupiah(Number(investasi) || 0) },
      { label: "Properti Investasi", value: formatRupiah(Number(properti) || 0) },
      { label: "Total Harta", value: formatRupiah(result.totalHarta) },
      { label: "Hutang", value: formatRupiah(result.totalHarta - result.hartaBersih) },
      { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
      { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
    ], result.zakatAmount, result.isWajib);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Tabungan (Rp)</Label>
          <Input type="number" placeholder="0" value={tabungan} onChange={(e) => setTabungan(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Emas (gram)</Label>
          <Input type="number" placeholder="0" value={emas} onChange={(e) => setEmas(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Perak (gram)</Label>
          <Input type="number" placeholder="0" value={perak} onChange={(e) => setPerak(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Investasi / Saham (Rp)</Label>
          <Input type="number" placeholder="0" value={investasi} onChange={(e) => setInvestasi(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Properti Investasi (Rp)</Label>
          <Input type="number" placeholder="0" value={properti} onChange={(e) => setProperti(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Hutang (Rp)</Label>
          <Input type="number" placeholder="0" value={hutang} onChange={(e) => setHutang(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleCalc} className="w-full">Hitung Zakat Maal</Button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="rounded-lg border bg-muted/50 p-3 sm:p-5 space-y-2 sm:space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Total Harta</span>
              <span className="font-medium text-sm sm:text-base">{formatRupiah(result.totalHarta)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Hutang</span>
              <span className="font-medium text-sm sm:text-base">{formatRupiah(result.totalHarta - result.hartaBersih)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Harta Bersih</span>
              <span className="font-medium text-sm sm:text-base">{formatRupiah(result.hartaBersih)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Nisab ({result.nisabLabel})</span>
              <span className="font-medium text-sm sm:text-base">{formatRupiah(result.nisab)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Status</span>
              <Badge variant={result.isWajib ? "default" : "secondary"}>
                {result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
              </Badge>
            </div>
            <div className="border-t pt-2 sm:pt-3 flex items-center justify-between">
              <span className="font-semibold text-sm sm:text-base">Zakat yang Harus Dibayar</span>
              <motion.span
                key={result.zakatAmount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-xl sm:text-2xl font-bold text-primary"
              >
                {formatRupiah(result.zakatAmount)}
              </motion.span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
