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
import { focusFirstInvalid } from "@/lib/focus-invalid";
import { FieldError, ValidationSummary } from "@/components/ValidationHints";

interface Props {
  goldPrice: number;
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

export default function ZakatMadin({ goldPrice, isActive, onCalculated, prefill }: Props) {
  const [nilai, setNilai] = useState<string>(() => (prefill?.nilai as string) ?? "");
  const [attempted, setAttempted] = useState(false);


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

  const fields = [
    { id: "madin-nilai", label: "Nilai Hasil Tambang", invalid: nilaiN <= 0, message: "Isi nilai hasil tambang lebih dari 0." },
  ];

  const handleSave = () => {
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result) return;
    addHistory({ type: "Madin", amount: result.zakatAmount, detail: detailRows, inputs: { nilai } });
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
    <div className="space-y-3 sm:space-y-4">
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/60">
        Ma'din = hasil tambang (emas, perak, minyak, mineral). Menurut jumhur ulama: nisab setara 85g emas, kadar <strong>2,5%</strong>, dibayar saat hasil tambang diperoleh.
      </p>
      <div className="space-y-2">
        <Label htmlFor="madin-nilai" className="text-sm">Nilai Hasil Tambang (Rp)</Label>
        <Input id="madin-nilai" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
          value={nilai} onChange={(e) => formattedChange(e, setNilai, formatNumberInput)}
          aria-invalid={attempted && fields[0].invalid}
          aria-describedby={attempted && fields[0].invalid ? "madin-nilai-error" : undefined}
          className="h-11 sm:h-10 text-base" />
        {attempted && <FieldError id="madin-nilai" message={fields[0].invalid ? fields[0].message : undefined} />}
      </div>
      <ValidationSummary fields={fields} visible={attempted} />
      <div className="space-y-1.5">
        <Button onClick={handleSave} className="w-full h-11 sm:h-10">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi nilai hasil tambang untuk melihat perhitungan otomatis."}
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
