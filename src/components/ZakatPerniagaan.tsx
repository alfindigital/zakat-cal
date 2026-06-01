import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatPerniagaan, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  goldPrice: number;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatPerniagaan({ goldPrice, isActive, onCalculated }: Props) {
  const [modal, setModal] = useState("");
  const [piutang, setPiutang] = useState("");
  const [stok, setStok] = useState("");
  const [hutang, setHutang] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatPerniagaan> | null>(null);

  const modalN = parseFormattedNumber(modal);
  const piutangN = parseFormattedNumber(piutang);
  const stokN = parseFormattedNumber(stok);
  const hutangN = parseFormattedNumber(hutang);
  const canCalc = modalN + piutangN + stokN > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatPerniagaan(modalN, piutangN, stokN, hutangN, goldPrice);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Perniagaan", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Perniagaan", [
      { label: "Modal Kerja", value: formatRupiah(modalN) },
      { label: "Piutang Lancar", value: formatRupiah(piutangN) },
      { label: "Stok Dagang", value: formatRupiah(stokN) },
      { label: "Hutang Dagang", value: formatRupiah(hutangN) },
      { label: "Total Aset", value: formatRupiah(result.totalAset) },
      { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
      { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
    ], result.zakatAmount, result.isWajib);
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input id={id} type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
        value={value} onChange={(e) => set(formatNumberInput(e.target.value))}
        className="h-12 sm:h-10 text-base" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("perniagaan-modal", "Modal Kerja (Rp)", modal, setModal)}
        {field("perniagaan-piutang", "Piutang Lancar (Rp)", piutang, setPiutang)}
        {field("perniagaan-stok", "Stok Dagang (Rp)", stok, setStok)}
        {field("perniagaan-hutang", "Hutang Dagang (Rp)", hutang, setHutang)}
      </div>
      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Perniagaan
      </Button>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Total Aset", value: formatRupiah(result.totalAset) },
              { label: "Hutang Dagang", value: formatRupiah(hutangN) },
              { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
              { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
            ]}
            amount={result.zakatAmount}
            amountLabel="Zakat yang Harus Dibayar"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
      <MobileCta isActive={isActive} label="Hitung Zakat Perniagaan" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
