import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcZakatFitrah, formatRupiah, addHistory, RICE_OPTIONS } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatFitrah({ isActive, onCalculated }: Props) {
  const [jiwa, setJiwa] = useState("");
  const [riceIdx, setRiceIdx] = useState("0");
  const [result, setResult] = useState<ReturnType<typeof calcZakatFitrah> | null>(null);

  const jiwaNum = Number(jiwa) || 0;
  const canCalc = jiwaNum > 0;

  const handleCalc = () => {
    if (!canCalc) return;
    const r = calcZakatFitrah(jiwaNum, Number(riceIdx));
    setResult(r);
    addHistory({ type: "Fitrah", amount: r.total });
    onCalculated();
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf(
      "Fitrah",
      [
        { label: "Jumlah Jiwa", value: jiwa },
        { label: "Jenis Beras", value: RICE_OPTIONS[Number(riceIdx)].label },
        { label: "Harga Beras per kg", value: formatRupiah(RICE_OPTIONS[Number(riceIdx)].pricePerKg) },
        { label: `Per Jiwa (${result.kg} kg)`, value: formatRupiah(result.perPerson) },
      ],
      result.total,
      true,
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fitrah-jiwa" className="text-sm">Jumlah Jiwa / Anggota Keluarga</Label>
          <Input
            id="fitrah-jiwa"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1"
            value={jiwa}
            onChange={(e) => setJiwa(e.target.value.replace(/\D/g, ""))}
            className="h-12 sm:h-10 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Jenis Beras</Label>
          <Select value={riceIdx} onValueChange={setRiceIdx}>
            <SelectTrigger className="h-12 sm:h-10 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RICE_OPTIONS.map((r, i) => (
                <SelectItem key={i} value={String(i)}>
                  {r.label} — {formatRupiah(r.pricePerKg)}/kg
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleCalc} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Hitung Zakat Fitrah
      </Button>

      <AnimatePresence>
        {result && (
          <ResultCard
            rows={[
              { label: `Per Jiwa (${result.kg} kg)`, value: formatRupiah(result.perPerson) },
              { label: "Jumlah Jiwa", value: jiwa },
            ]}
            amount={result.total}
            amountLabel="Total Zakat Fitrah"
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>

      <MobileCta isActive={isActive} label="Hitung Zakat Fitrah" disabled={!canCalc} onClick={handleCalc} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
