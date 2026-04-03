import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { calcZakatFitrah, formatRupiah, addHistory, RICE_OPTIONS } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";

interface Props {
  onCalculated: () => void;
}

export default function ZakatFitrah({ onCalculated }: Props) {
  const [jiwa, setJiwa] = useState("");
  const [riceIdx, setRiceIdx] = useState("0");
  const [result, setResult] = useState<ReturnType<typeof calcZakatFitrah> | null>(null);

  const handleCalc = () => {
    const count = Number(jiwa) || 0;
    if (count <= 0) return;
    const r = calcZakatFitrah(count, Number(riceIdx));
    setResult(r);
    addHistory({ type: "Fitrah", amount: r.total });
    onCalculated();
  };

  const handleDownload = () => {
    if (!result) return;
    generateZakatPdf("Fitrah", [
      { label: "Jumlah Jiwa", value: jiwa },
      { label: "Jenis Beras", value: RICE_OPTIONS[Number(riceIdx)].label },
      { label: "Harga Beras per kg", value: formatRupiah(RICE_OPTIONS[Number(riceIdx)].pricePerKg) },
      { label: `Per Jiwa (${result.kg} kg)`, value: formatRupiah(result.perPerson) },
    ], result.total, true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Jumlah Jiwa / Anggota Keluarga</Label>
          <Input type="number" placeholder="1" min={1} value={jiwa} onChange={(e) => setJiwa(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Jenis Beras</Label>
          <Select value={riceIdx} onValueChange={setRiceIdx}>
            <SelectTrigger>
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

      <Button onClick={handleCalc} className="w-full">Hitung Zakat Fitrah</Button>

      {result && (
        <div className="rounded-lg border bg-muted/50 p-3 sm:p-5 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Per Jiwa ({result.kg} kg)</span>
            <span className="font-medium text-sm sm:text-base">{formatRupiah(result.perPerson)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Jumlah Jiwa</span>
            <span className="font-medium text-sm sm:text-base">{jiwa}</span>
          </div>
          <div className="border-t pt-2 sm:pt-3 flex items-center justify-between">
            <span className="font-semibold text-sm sm:text-base">Total Zakat Fitrah</span>
            <span className="text-xl sm:text-2xl font-bold text-primary">{formatRupiah(result.total)}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      )}
    </div>
  );
}
