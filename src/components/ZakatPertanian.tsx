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
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";
import { FieldError, ValidationSummary } from "@/components/ValidationHints";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

export default function ZakatPertanian({ isActive, onCalculated, prefill }: Props) {
  const [hasilKg, setHasilKg] = useState<string>(() => (prefill?.hasilKg as string) ?? "");
  const [hargaKg, setHargaKg] = useState<string>(() => (prefill?.hargaKg as string) ?? "");
  const [irr, setIrr] = useState<IrrigationType>(() => (prefill?.irr as IrrigationType) ?? "tadah_hujan");
  const [attempted, setAttempted] = useState(false);


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

  const fields = [
    { id: "tani-hasil", label: "Hasil Panen (kg)", invalid: hasilN <= 0, message: "Isi jumlah hasil panen dalam kg." },
    { id: "tani-harga", label: "Harga per kg", invalid: hargaN <= 0, message: "Isi harga jual per kg." },
  ];

  const handleSave = () => {
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Pertanian", amount: result.zakatAmount, detail: detailRows, inputs: { hasilKg, hargaKg, irr } });
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
            value={hasilKg} onChange={(e) => formattedChange(e, setHasilKg, formatQuantityInput)}
            aria-invalid={attempted && fields[0].invalid}
            aria-describedby={attempted && fields[0].invalid ? "tani-hasil-error" : undefined}
            className="h-12 sm:h-10 text-base" />
          {attempted && <FieldError id="tani-hasil" message={fields[0].invalid ? fields[0].message : undefined} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tani-harga" className="text-sm">Harga per kg (Rp)</Label>
          <Input id="tani-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={hargaKg} onChange={(e) => formattedChange(e, setHargaKg, formatNumberInput)}
            aria-invalid={attempted && fields[1].invalid}
            aria-describedby={attempted && fields[1].invalid ? "tani-harga-error" : undefined}
            className="h-12 sm:h-10 text-base" />
          {attempted && <FieldError id="tani-harga" message={fields[1].invalid ? fields[1].message : undefined} />}
        </div>
      </div>
      <ValidationSummary fields={fields} visible={attempted} />
      <div className="space-y-1.5">
        <Button onClick={handleSave} aria-disabled={!canCalc} className="w-full h-11">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi hasil panen & harga per kg untuk melihat perhitungan otomatis."}
        </p>
      </div>
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
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
