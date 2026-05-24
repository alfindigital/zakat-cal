import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatMaal, formatRupiah, addHistory, type NisabType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  goldPrice: number;
  silverPrice: number;
  nisabType: NisabType;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatMaal({ goldPrice, silverPrice, nisabType, isActive, onCalculated }: Props) {
  const [tabungan, setTabungan] = useState("");
  const [emas, setEmas] = useState("");
  const [perak, setPerak] = useState("");
  const [investasi, setInvestasi] = useState("");
  const [properti, setProperti] = useState("");
  const [hutang, setHutang] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatMaal> | null>(null);

  const tabunganNum = parseFormattedNumber(tabungan);
  const emasNum = parseFormattedNumber(emas);
  const perakNum = parseFormattedNumber(perak);
  const investasiNum = parseFormattedNumber(investasi);
  const propertiNum = parseFormattedNumber(properti);
  const hutangNum = parseFormattedNumber(hutang);

  const canCalc = tabunganNum + emasNum + perakNum + investasiNum + propertiNum > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatMaal(tabunganNum, emasNum, perakNum, investasiNum, propertiNum, hutangNum, goldPrice, silverPrice, nisabType);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Maal", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf(
      "Maal",
      [
        { label: "Tabungan", value: formatRupiah(tabunganNum) },
        { label: "Nilai Emas", value: formatRupiah(result.emasValue) },
        { label: "Nilai Perak", value: formatRupiah(result.perakValue) },
        { label: "Investasi / Saham", value: formatRupiah(investasiNum) },
        { label: "Properti Investasi", value: formatRupiah(propertiNum) },
        { label: "Total Harta", value: formatRupiah(result.totalHarta) },
        { label: "Hutang", value: formatRupiah(result.totalHarta - result.hartaBersih) },
        { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
        { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
      ],
      result.zakatAmount,
      result.isWajib,
    );
  };

  const numField = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*"
        placeholder="0"
        value={value}
        onChange={(e) => set(formatNumberInput(e.target.value))}
        className="h-12 sm:h-10 text-base"
      />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2">
        {numField("maal-tabungan", "Tabungan (Rp)", tabungan, setTabungan)}
        {numField("maal-emas", "Emas (gram)", emas, setEmas)}
        {numField("maal-perak", "Perak (gram)", perak, setPerak)}
        {numField("maal-investasi", "Investasi / Saham (Rp)", investasi, setInvestasi)}
        {numField("maal-properti", "Properti Investasi (Rp)", properti, setProperti)}
        {numField("maal-hutang", "Hutang (Rp)", hutang, setHutang)}
      </div>

      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Maal
      </Button>

      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Total Harta", value: formatRupiah(result.totalHarta) },
              { label: "Hutang", value: formatRupiah(result.totalHarta - result.hartaBersih) },
              { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
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

      <MobileCta isActive={isActive} label="Hitung Zakat Maal" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
