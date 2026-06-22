import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { calcZakatPertanian, formatRupiah, addHistory, type IrrigationType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formatQuantityInput, parseQuantity, formattedChange } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatPertanian({ isActive, onCalculated }: Props) {
  const [hasilKg, setHasilKg] = useState("");
  const [hargaKg, setHargaKg] = useState("");
  const [irr, setIrr] = useState<IrrigationType>("tadah_hujan");

  const hasilN = parseQuantity(hasilKg);
  const hargaN = parseFormattedNumber(hargaKg);
  const canCalc = hasilN > 0 && hargaN > 0;

  const result = useMemo(
    () => (canCalc ? calcZakatPertanian(hasilN, hargaN, irr) : null),
    [canCalc, hasilN, hargaN, irr],
  );

  const detailRows = result
    ? [
        { label: "Nilai Panen", value: formatRupiah(result.totalValue) },
        { label: "Nisab", value: `${result.nisabKg} kg` },
        { label: "Kadar", value: `${(result.rate * 100).toFixed(0)}%` },
        { label: "Zakat (kg)", value: `${result.zakatKg.toLocaleString("id-ID")} kg` },
      ]
    : [];

  const handleSave = () => {
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Pertanian", amount: result.zakatAmount, detail: detailRows });
    onCalculated();
    track("save", { type: "Pertanian" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Pertanian" });
    generateZakatPdf("Pertanian", [
      { label: "Hasil Panen", value: `${hasilN.toLocaleString("id-ID")} kg` },
      { label: "Harga per kg", value: formatRupiah(hargaN) },
      { label: "Nilai Panen", value: formatRupiah(result.totalValue) },
      { label: "Jenis Pengairan", value: irr === "tadah_hujan" ? "Tadah Hujan (10%)" : "Irigasi/Biaya (5%)" },
      { label: "Nisab", value: `${result.nisabKg} kg` },
      { label: "Zakat (kg)", value: `${result.zakatKg.toLocaleString("id-ID")} kg` },
    ], result.zakatAmount, result.isWajib).catch(() => toast.error("Gagal membuat PDF"));
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
          <Input id="tani-hasil" type="text" inputMode="decimal" placeholder="0"
            value={hasilKg} onChange={(e) => formattedChange(e, setHasilKg, formatQuantityInput)} className="h-12 sm:h-10 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tani-harga" className="text-sm">Harga per kg (Rp)</Label>
          <Input id="tani-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={hargaKg} onChange={(e) => formattedChange(e, setHargaKg, formatNumberInput)} className="h-12 sm:h-10 text-base" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={!result || result.zakatAmount <= 0} className="w-full h-11 hidden md:inline-flex">
        Simpan ke Riwayat
      </Button>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={detailRows}
            amount={result.zakatAmount}
            amountLabel="Zakat yang Harus Dibayar"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            notWajibHint={`Hasil panen belum mencapai nisab ${result.nisabKg} kg.`}
            onDownload={handleDownload}
            waType="Pertanian"
          />
        )}
      </AnimatePresence>
      <MobileCta isActive={isActive} label="Simpan ke Riwayat" disabled={!result || result.zakatAmount <= 0} onClick={handleSave} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
