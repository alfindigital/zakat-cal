import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatPenghasilan, formatRupiah, addHistory, type NisabType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  metalPrice: number;
  nisabType: NisabType;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatPenghasilan({ metalPrice, nisabType, isActive, onCalculated }: Props) {
  const [monthly, setMonthly] = useState("");
  const [bonus, setBonus] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatPenghasilan> | null>(null);

  const monthlyNum = parseFormattedNumber(monthly);
  const canCalc = monthlyNum > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatPenghasilan(monthlyNum, parseFormattedNumber(bonus), metalPrice, nisabType);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Penghasilan", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf(
      "Penghasilan",
      [
        { label: "Penghasilan Bulanan", value: formatRupiah(monthlyNum) },
        { label: "Bonus / THR Tahunan", value: formatRupiah(parseFormattedNumber(bonus)) },
        { label: "Penghasilan Tahunan", value: formatRupiah(result.annualIncome) },
        { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
      ],
      result.zakatAmount,
      result.isWajib,
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="penghasilan-bulanan" className="text-sm">Penghasilan Bulanan (Rp)</Label>
          <Input
            id="penghasilan-bulanan"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            value={monthly}
            onChange={(e) => setMonthly(formatNumberInput(e.target.value))}
            className="h-12 sm:h-10 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="penghasilan-bonus" className="text-sm">Bonus / THR Tahunan (Rp)</Label>
          <Input
            id="penghasilan-bonus"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            value={bonus}
            onChange={(e) => setBonus(formatNumberInput(e.target.value))}
            className="h-12 sm:h-10 text-base"
          />
        </div>
      </div>

      {/* Desktop button (mobile uses sticky CTA) */}
      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Penghasilan
      </Button>

      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Penghasilan Tahunan", value: formatRupiah(result.annualIncome) },
              { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
            ]}
            amount={result.zakatAmount}
            amountLabel="Zakat yang Harus Dibayar"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>

      <MobileCta isActive={isActive} label="Hitung Zakat Penghasilan" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
