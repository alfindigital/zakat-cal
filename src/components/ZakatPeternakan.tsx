import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcZakatPeternakan, formatRupiah, addHistory, type LivestockType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { formatNumberInput, parseFormattedNumber } from "@/lib/format";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

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
  const [result, setResult] = useState<ReturnType<typeof calcZakatPeternakan> | null>(null);

  const jumlahN = parseFormattedNumber(jumlah);
  const hargaN = parseFormattedNumber(harga);
  const canCalc = jumlahN > 0 && hargaN > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatPeternakan(jumlahN, type, hargaN);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Peternakan", amount: r.zakatAmount });
      onCalculated();
    }
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Peternakan", [
      { label: "Jenis Hewan", value: LABEL[type] },
      { label: "Jumlah", value: `${jumlahN.toLocaleString("id-ID")} ekor` },
      { label: "Harga per Ekor", value: formatRupiah(hargaN) },
      { label: "Nisab Minimum", value: `${result.minNisab} ekor` },
      { label: "Zakat Wajib", value: result.zakatDescription },
    ], result.zakatAmount, result.isWajib);
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
          <Input id="ternak-jumlah" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={jumlah} onChange={(e) => setJumlah(formatNumberInput(e.target.value))} className="h-12 sm:h-10 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ternak-harga" className="text-sm">Harga per Ekor (Rp)</Label>
          <Input id="ternak-harga" type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
            value={harga} onChange={(e) => setHarga(formatNumberInput(e.target.value))} className="h-12 sm:h-10 text-base" />
        </div>
      </div>
      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Peternakan
      </Button>
      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: "Jenis", value: LABEL[type] },
              { label: "Jumlah", value: `${jumlahN.toLocaleString("id-ID")} ekor` },
              { label: "Nisab Minimum", value: `${result.minNisab} ekor` },
              { label: "Zakat Wajib", value: result.zakatDescription },
            ]}
            amount={result.zakatAmount}
            amountLabel="Estimasi Nilai Zakat"
            isWajib={result.isWajib}
            statusLabel={result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
      <MobileCta isActive={isActive} label="Hitung Zakat Peternakan" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
