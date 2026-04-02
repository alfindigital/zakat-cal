import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { calcZakatMaal, formatRupiah, addHistory } from "@/lib/zakat";

interface Props {
  goldPrice: number;
  onCalculated: () => void;
}

export default function ZakatMaal({ goldPrice, onCalculated }: Props) {
  const [tabungan, setTabungan] = useState("");
  const [emas, setEmas] = useState("");
  const [perak, setPerak] = useState("");
  const [investasi, setInvestasi] = useState("");
  const [properti, setProperti] = useState("");
  const [hutang, setHutang] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcZakatMaal> | null>(null);

  const handleCalc = () => {
    const r = calcZakatMaal(
      Number(tabungan) || 0, Number(emas) || 0, Number(perak) || 0,
      Number(investasi) || 0, Number(properti) || 0, Number(hutang) || 0, goldPrice
    );
    setResult(r);
    if (r.zakatAmount > 0) {
      addHistory({ type: "Maal", amount: r.zakatAmount });
      onCalculated();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tabungan (Rp)</Label>
          <Input type="number" placeholder="0" value={tabungan} onChange={(e) => setTabungan(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Emas (gram)</Label>
          <Input type="number" placeholder="0" value={emas} onChange={(e) => setEmas(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Perak (gram)</Label>
          <Input type="number" placeholder="0" value={perak} onChange={(e) => setPerak(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Investasi / Saham (Rp)</Label>
          <Input type="number" placeholder="0" value={investasi} onChange={(e) => setInvestasi(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Properti Investasi (Rp)</Label>
          <Input type="number" placeholder="0" value={properti} onChange={(e) => setProperti(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Hutang (Rp)</Label>
          <Input type="number" placeholder="0" value={hutang} onChange={(e) => setHutang(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleCalc} className="w-full">Hitung Zakat Maal</Button>

      {result && (
        <div className="rounded-lg border bg-muted/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Harta</span>
            <span className="font-medium">{formatRupiah(result.totalHarta)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hutang</span>
            <span className="font-medium">{formatRupiah(result.totalHarta - result.hartaBersih)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Harta Bersih</span>
            <span className="font-medium">{formatRupiah(result.hartaBersih)}</span>
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
