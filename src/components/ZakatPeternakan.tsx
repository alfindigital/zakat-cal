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

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

const LABEL: Record<LivestockType, string> = {
  kambing: "Kambing / Domba",
  sapi: "Sapi / Kerbau",
  unta: "Unta",
};

export default function ZakatPeternakan({ isActive, onCalculated }: Props) {
  const [type, setType] = useState<LivestockType>("kambing");
  const [jumlah, setJumlah] = useState("");
  const [harga, setHarga] = useState("");

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

  const handleSave = () => {
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Peternakan", amount: result.zakatAmount, detail: detailRows });
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
    <div className="space-y-4 sm:space-y-6">
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
            value={jumlah} onChange={(e) => formattedChange(e, setJumlah, formatNumberInput)} className="h-12 sm:h-10 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ternak-harga" className="text-sm">Harga per Ekor (Rp)</Label>
          <Input id="ternak-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={harga} onChange={(e) => formattedChange(e, setHarga, formatNumberInput)} className="h-12 sm:h-10 text-base" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={!result || result.zakatAmount <= 0} className="w-full h-11">
        Simpan ke Riwayat
      </Button>
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
