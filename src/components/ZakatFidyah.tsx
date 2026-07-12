import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcFidyah, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatFidyah({ isActive, onCalculated }: Props) {
  const [hari, setHari] = useState("");
  const [harga, setHarga] = useState("");

  const hariN = Number(hari) || 0;
  const hargaN = parseFormattedNumber(harga);
  const canCalc = hariN > 0 && hargaN > 0;

  const result = useMemo(() => (canCalc ? calcFidyah(hariN, hargaN) : null), [canCalc, hariN, hargaN]);

  const detailRows = result
    ? [
        { label: "Jumlah Hari", value: `${result.days} hari` },
        { label: "Nilai per Hari", value: formatRupiah(result.perDay) },
        { label: "Takaran", value: `±${result.kgPerDay} kg makanan pokok/hari` },
      ]
    : [];

  const handleSave = () => {
    if (focusFirstInvalid([
      { id: "fidyah-hari", label: "Jumlah Hari Ditinggalkan", invalid: hariN <= 0 },
      { id: "fidyah-harga", label: "Nilai per Hari", invalid: hargaN <= 0 },
    ])) return;
    if (!result || result.total <= 0) return;
    addHistory({ type: "Fidyah", amount: result.total, detail: detailRows });
    onCalculated();
    track("save", { type: "Fidyah" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Fidyah" });
    generateZakatPdf("Fidyah", detailRows, result.total, true).catch(() => toast.error("Gagal membuat PDF"));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
        Fidyah = denda bagi yang meninggalkan puasa Ramadhan dan tidak mampu menggantinya (mis. lansia, sakit menahun, ibu hamil/menyusui sesuai pendapat tertentu).
        Besarnya ±1 mud (<strong>±0,75 kg</strong>) makanan pokok per hari, atau senilai uang.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fidyah-hari" className="text-sm">Jumlah Hari Ditinggalkan</Label>
          <Input id="fidyah-hari" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
            value={hari} onChange={(e) => setHari(e.target.value.replace(/\D/g, ""))} className="h-12 sm:h-10 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fidyah-harga" className="text-sm">Nilai per Hari (Rp)</Label>
          <Input id="fidyah-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="contoh 25.000"
            value={harga} onChange={(e) => formattedChange(e, setHarga, formatNumberInput)} className="h-12 sm:h-10 text-base" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Button onClick={handleSave} aria-disabled={!canCalc} className="w-full h-11">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi jumlah hari & nilai per hari untuk melihat perhitungan otomatis."}
        </p>
      </div>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={detailRows}
            amount={result.total}
            amountLabel="Total Fidyah"
            isWajib
            statusLabel="Wajib Ditunaikan"
            onDownload={handleDownload}
            waType="Fidyah"
          />
        )}
      </AnimatePresence>
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
