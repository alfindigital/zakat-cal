import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcZakatFitrah, formatRupiah, addHistory, RICE_OPTIONS } from "@/lib/zakat";

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Jumlah Jiwa / Anggota Keluarga</Label>
          <Input type="number" placeholder="1" min={1} value={jiwa} onChange={(e) => setJiwa(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Jenis Beras</Label>
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
        <div className="rounded-lg border bg-muted/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Per Jiwa ({result.kg} kg)</span>
            <span className="font-medium">{formatRupiah(result.perPerson)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Jumlah Jiwa</span>
            <span className="font-medium">{jiwa}</span>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total Zakat Fitrah</span>
            <span className="text-2xl font-bold text-primary">{formatRupiah(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
