import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcZakatPeternakan, formatRupiah, addHistory, type LivestockType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";
import { FieldError, ValidationSummary } from "@/components/ValidationHints";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

const LABEL: Record<LivestockType, string> = {
  kambing: "Kambing / Domba",
  sapi: "Sapi / Kerbau",
  unta: "Unta",
};

export default function ZakatPeternakan({ isActive, onCalculated, prefill }: Props) {
  const [type, setType] = useState<LivestockType>(() => (prefill?.type as LivestockType) ?? "kambing");
  const [jumlah, setJumlah] = useState<string>(() => (prefill?.jumlah as string) ?? "");
  const [harga, setHarga] = useState<string>(() => (prefill?.harga as string) ?? "");
  const [attempted, setAttempted] = useState(false);


  const jumlahN = parseFormattedNumber(jumlah);
  const hargaN = parseFormattedNumber(harga);
  const canCalc = jumlahN > 0 && hargaN > 0;

  const result = useMemo(
    () => (canCalc ? calcZakatPeternakan(jumlahN, type, hargaN) : null),
    [canCalc, jumlahN, type, hargaN],
  );

  const detailRows = result
    ? [
        { label: "Jenis", value: LABEL[type] },
        { label: "Jumlah", value: `${jumlahN.toLocaleString("id-ID")} ekor` },
        { label: "Nisab Minimum", value: `${result.minNisab} ekor` },
        { label: "Zakat Wajib", value: result.zakatDescription },
      ]
    : [];

  const fields = [
    { id: "ternak-jumlah", label: "Jumlah ekor", invalid: jumlahN <= 0, message: "Isi jumlah ekor ternak." },
    { id: "ternak-harga", label: "Harga per Ekor", invalid: hargaN <= 0, message: "Isi harga rata-rata per ekor." },
  ];

  const handleSave = () => {
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Peternakan", amount: result.zakatAmount, detail: detailRows, inputs: { type, jumlah, harga } });
    onCalculated();
    track("save", { type: "Peternakan" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Peternakan" });
    generateZakatPdf("Peternakan", [
      { label: "Jenis Hewan", value: LABEL[type] },
      { label: "Jumlah", value: `${jumlahN.toLocaleString("id-ID")} ekor` },
      { label: "Harga per Ekor", value: formatRupiah(hargaN) },
      { label: "Nisab Minimum", value: `${result.minNisab} ekor` },
      { label: "Zakat Wajib", value: result.zakatDescription },
    ], result.zakatAmount, result.isWajib).catch(() => toast.error("Gagal membuat PDF"));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Jenis Hewan</Label>
        <Select value={type} onValueChange={(v) => setType(v as LivestockType)}>
          <SelectTrigger className="h-12 sm:h-10 text-base"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="kambing">Kambing / Domba (nisab 40 ekor)</SelectItem>
            <SelectItem value="sapi">Sapi / Kerbau (nisab 30 ekor)</SelectItem>
            <SelectItem value="unta">Unta (nisab 5 ekor)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ternak-jumlah" className="text-sm">Jumlah (ekor)</Label>
          <Input id="ternak-jumlah" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
            value={jumlah} onChange={(e) => formattedChange(e, setJumlah, formatNumberInput)}
            aria-invalid={attempted && fields[0].invalid}
            aria-describedby={attempted && fields[0].invalid ? "ternak-jumlah-error" : undefined}
            className="h-12 sm:h-10 text-base" />
          {attempted && <FieldError id="ternak-jumlah" message={fields[0].invalid ? fields[0].message : undefined} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ternak-harga" className="text-sm">Harga per Ekor (Rp)</Label>
          <Input id="ternak-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={harga} onChange={(e) => formattedChange(e, setHarga, formatNumberInput)}
            aria-invalid={attempted && fields[1].invalid}
            aria-describedby={attempted && fields[1].invalid ? "ternak-harga-error" : undefined}
            className="h-12 sm:h-10 text-base" />
          {attempted && <FieldError id="ternak-harga" message={fields[1].invalid ? fields[1].message : undefined} />}
        </div>
      </div>
      <ValidationSummary fields={fields} visible={attempted} />
      <div className="space-y-1.5">
        <Button onClick={handleSave} aria-disabled={!canCalc} className="w-full h-11">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi jumlah & harga per ekor untuk melihat perhitungan otomatis."}
        </p>
      </div>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={detailRows}
            amount={result.zakatAmount}
            amountLabel="Estimasi Nilai Zakat"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            notWajibHint={`Jumlah ternak belum mencapai nisab ${result.minNisab} ekor.`}
            onDownload={handleDownload}
            waType="Peternakan"
          />
        )}
      </AnimatePresence>
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
