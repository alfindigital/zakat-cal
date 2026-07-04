import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatRikaz, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatRikaz({ isActive, onCalculated }: Props) {
  const [nilai, setNilai] = useState("");

  const nilaiN = parseFormattedNumber(nilai);
  const canCalc = nilaiN > 0;

  const result = useMemo(() => (canCalc ? calcZakatRikaz(nilaiN) : null), [canCalc, nilaiN]);

  const detailRows = result
    ? [
        { label: "Nilai Harta", value: formatRupiah(nilaiN) },
        { label: "Kadar", value: "20%" },
      ]
    : [];

  const handleSave = () => {
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Rikaz", amount: result.zakatAmount, detail: detailRows });
    onCalculated();
    track("save", { type: "Rikaz" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Rikaz" });
    generateZakatPdf("Rikaz", [
      { label: "Nilai Harta Temuan", value: formatRupiah(nilaiN) },
      { label: "Kadar", value: "20% (tanpa nisab, tanpa haul)" },
    ], result.zakatAmount, result.isWajib).catch(() => toast.error("Gagal membuat PDF"));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
        Rikaz = harta terpendam / karun yang ditemukan. Wajib zakat <strong>20%</strong> langsung tanpa menunggu haul dan tanpa syarat nisab.
      </p>
      <div className="space-y-2">
        <Label htmlFor="rikaz-nilai" className="text-sm">Nilai Harta yang Ditemukan (Rp)</Label>
        <Input id="rikaz-nilai" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
          value={nilai} onChange={(e) => formattedChange(e, setNilai, formatNumberInput)} className="h-12 sm:h-10 text-base" />
      </div>
      <Button onClick={handleSave} disabled={!result || result.zakatAmount <= 0} className="w-full h-11">
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
            onDownload={handleDownload}
            waType="Rikaz"
          />
        )}
      </AnimatePresence>
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
