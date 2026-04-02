import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { calcZakatPenghasilan, formatRupiah, addHistory } from "@/lib/zakat";

interface Props {
  goldPrice: number;
  onCalculated: () => void;
}

export default function ZakatPenghasilan({ goldPrice, onCalculated }: Props) {
  const [monthly, setMonthly] = useState("");
  const [bonus, setBonus] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatPenghasilan> | null>(null);

  const handleCalc = () => {
    const r = calcZakatPenghasilan(Number(monthly) || 0, Number(bonus) || 0, goldPrice);
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Penghasilan", amount: r.zakatAmount });
      onCalculated();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Penghasilan Bulanan (Rp)</Label>
          <Input type="number" placeholder="0" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bonus / THR Tahunan (Rp)</Label>
          <Input type="number" placeholder="0" value={bonus} onChange={(e) => setBonus(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleCalc} className="w-full">Hitung Zakat Penghasilan</Button>

      {result && (
        <div className="rounded-lg border bg-muted/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Penghasilan Tahunan</span>
            <span className="font-medium">{formatRupiah(result.annualIncome)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nisab (85g emas)</span>
            <span className="font-medium">{formatRupiah(result.nisab)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={result.isWajib ? "default" : "secondary"}>
              {result.isWajib ? "Wajib Zakat" : "Belum Wajib"}
            </Badge>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Zakat yang Harus Dibayar</span>
            <span className="text-2xl font-bold text-primary">{formatRupiah(result.zakatAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
