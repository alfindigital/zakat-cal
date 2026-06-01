import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatRikaz, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatRikaz({ isActive, onCalculated }: Props) {
  const [nilai, setNilai] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatRikaz> | null>(null);

  const nilaiN = parseFormattedNumber(nilai);
  const canCalc = nilaiN > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatRikaz(nilaiN);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Rikaz", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Rikaz", [
      { label: "Nilai Harta Temuan", value: formatRupiah(nilaiN) },
      { label: "Kadar", value: "20% (tanpa nisab, tanpa haul)" },
    ], result.zakatAmount, result.isWajib);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
        Rikaz = harta terpendam / karun yang ditemukan. Wajib zakat <strong>20%</strong> langsung tanpa menunggu haul dan tanpa syarat nisab.
      </p>
      <div className="space-y-2">
        <Label htmlFor="rikaz-nilai" className="text-sm">Nilai Harta yang Ditemukan (Rp)</Label>
        <Input id="rikaz-nilai" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
          value={nilai} onChange={(e) => setNilai(formatNumberInput(e.target.value))} className="h-12 sm:h-10 text-base" />
      </div>
      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Rikaz
      </Button>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Nilai Harta", value: formatRupiah(nilaiN) },
              { label: "Kadar", value: "20%" },
            ]}
            amount={result.zakatAmount}
            amountLabel="Zakat yang Harus Dibayar"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
      <MobileCta isActive={isActive} label="Hitung Zakat Rikaz" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
