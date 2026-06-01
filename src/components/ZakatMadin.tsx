import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatMadin, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  goldPrice: number;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatMadin({ goldPrice, isActive, onCalculated }: Props) {
  const [nilai, setNilai] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatMadin> | null>(null);

  const nilaiN = parseFormattedNumber(nilai);
  const canCalc = nilaiN > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatMadin(nilaiN, goldPrice);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Madin", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Ma'din", [
      { label: "Nilai Hasil Tambang", value: formatRupiah(nilaiN) },
      { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
      { label: "Kadar", value: "2,5%" },
    ], result.zakatAmount, result.isWajib);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
        Ma'din = hasil tambang (emas, perak, minyak, mineral). Menurut jumhur ulama: nisab setara 85g emas, kadar <strong>2,5%</strong>, dibayar saat hasil tambang diperoleh.
      </p>
      <div className="space-y-2">
        <Label htmlFor="madin-nilai" className="text-sm">Nilai Hasil Tambang (Rp)</Label>
        <Input id="madin-nilai" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
          value={nilai} onChange={(e) => setNilai(formatNumberInput(e.target.value))} className="h-12 sm:h-10 text-base" />
      </div>
      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Ma'din
      </Button>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Nilai Tambang", value: formatRupiah(nilaiN) },
              { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
              { label: "Kadar", value: "2,5%" },
            ]}
            amount={result.zakatAmount}
            amountLabel="Zakat yang Harus Dibayar"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
      <MobileCta isActive={isActive} label="Hitung Zakat Ma'din" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
