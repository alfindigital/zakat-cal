import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatMadin, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";

interface Props {
  goldPrice: number;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatMadin({ goldPrice, isActive, onCalculated }: Props) {
  const [nilai, setNilai] = useState("");

  const nilaiN = parseFormattedNumber(nilai);
  const canCalc = nilaiN > 0;

  const result = useMemo(() => (canCalc ? calcZakatMadin(nilaiN, goldPrice) : null), [canCalc, nilaiN, goldPrice]);

  const detailRows = result
    ? [
        { label: "Nilai Tambang", value: formatRupiah(nilaiN) },
        { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
        { label: "Kadar", value: "2,5%" },
      ]
    : [];

  const handleSave = () => {
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Madin", amount: result.zakatAmount, detail: detailRows });
    onCalculated();
    track("save", { type: "Madin" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Madin" });
    generateZakatPdf("Ma'din", [
      { label: "Nilai Hasil Tambang", value: formatRupiah(nilaiN) },
      { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
      { label: "Kadar", value: "2,5%" },
    ], result.zakatAmount, result.isWajib).catch(() => toast.error("Gagal membuat PDF"));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
        Ma'din = hasil tambang (emas, perak, minyak, mineral). Menurut jumhur ulama: nisab setara 85g emas, kadar <strong>2,5%</strong>, dibayar saat hasil tambang diperoleh.
      </p>
      <div className="space-y-2">
        <Label htmlFor="madin-nilai" className="text-sm">Nilai Hasil Tambang (Rp)</Label>
        <Input id="madin-nilai" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
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
            notWajibHint={`Nilai hasil tambang belum mencapai nisab ${formatRupiah(result.nisab)}.`}
            onDownload={handleDownload}
            waType="Madin"
          />
        )}
      </AnimatePresence>
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
