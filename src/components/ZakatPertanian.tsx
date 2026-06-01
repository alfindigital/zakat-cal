import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { calcZakatPertanian, formatRupiah, addHistory, type IrrigationType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatPertanian({ isActive, onCalculated }: Props) {
  const [hasilKg, setHasilKg] = useState("");
  const [hargaKg, setHargaKg] = useState("");
  const [irr, setIrr] = useState<IrrigationType>("tadah_hujan");
  const [result, setResult] = useState<ReturnType<typeof calcZakatPertanian> | null>(null);

  const hasilN = parseFormattedNumber(hasilKg);
  const hargaN = parseFormattedNumber(hargaKg);
  const canCalc = hasilN > 0 && hargaN > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatPertanian(hasilN, hargaN, irr);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Pertanian", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Pertanian", [
      { label: "Hasil Panen", value: `${hasilN.toLocaleString("id-ID")} kg` },
      { label: "Harga per kg", value: formatRupiah(hargaN) },
      { label: "Nilai Panen", value: formatRupiah(result.totalValue) },
      { label: "Jenis Pengairan", value: irr === "tadah_hujan" ? "Tadah Hujan (10%)" : "Irigasi/Biaya (5%)" },
      { label: "Nisab", value: `${result.nisabKg} kg` },
      { label: "Zakat (kg)", value: `${result.zakatKg.toLocaleString("id-ID")} kg` },
    ], result.zakatAmount, result.isWajib);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground font-medium">Jenis Pengairan</Label>
        <ToggleGroup type="single" value={irr} onValueChange={(v) => v && setIrr(v as IrrigationType)}
          className="w-full gap-0 rounded-lg border border-border/60 p-0.5">
          <ToggleGroupItem value="tadah_hujan" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
            🌧️ Tadah Hujan (10%)
          </ToggleGroupItem>
          <ToggleGroupItem value="irigasi" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
            💧 Irigasi/Biaya (5%)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tani-hasil" className="text-sm">Hasil Panen (kg)</Label>
          <Input id="tani-hasil" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={hasilKg} onChange={(e) => setHasilKg(formatNumberInput(e.target.value))} className="h-12 sm:h-10 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tani-harga" className="text-sm">Harga per kg (Rp)</Label>
          <Input id="tani-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={hargaKg} onChange={(e) => setHargaKg(formatNumberInput(e.target.value))} className="h-12 sm:h-10 text-base" />
        </div>
      </div>
      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Pertanian
      </Button>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Nilai Panen", value: formatRupiah(result.totalValue) },
              { label: "Nisab", value: `${result.nisabKg} kg` },
              { label: "Kadar", value: `${(result.rate * 100).toFixed(0)}%` },
              { label: "Zakat (kg)", value: `${result.zakatKg.toLocaleString("id-ID")} kg` },
            ]}
            amount={result.zakatAmount}
            amountLabel="Zakat yang Harus Dibayar"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
      <MobileCta isActive={isActive} label="Hitung Zakat Pertanian" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
