import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { calcZakatPenghasilan, formatRupiah, addHistory, type NisabType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";

interface Props {
  metalPrice: number;
  nisabType: NisabType;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatPenghasilan({ metalPrice, nisabType, isActive, onCalculated }: Props) {
  const [monthly, setMonthly] = useState("");
  const [bonus, setBonus] = useState("");
  const [method, setMethod] = useState<"bruto" | "netto">("bruto");
  const [deduction, setDeduction] = useState("");

  const monthlyNum = parseFormattedNumber(monthly);
  const deductionNum = method === "netto" ? parseFormattedNumber(deduction) : 0;
  const canCalc = monthlyNum > 0;

  const result = useMemo(
    () =>
      canCalc
        ? calcZakatPenghasilan(monthlyNum, parseFormattedNumber(bonus), metalPrice, nisabType, deductionNum)
        : null,
    [canCalc, monthlyNum, bonus, metalPrice, nisabType, deductionNum],
  );

  const detailRows = result
    ? [
        ...(method === "netto"
          ? [{ label: "Penghasilan Bruto/th", value: formatRupiah(result.grossAnnual) }]
          : []),
        { label: "Penghasilan Kena Zakat/th", value: formatRupiah(result.annualIncome) },
        { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
        { label: "Setara per bulan", value: formatRupiah(result.zakatMonthly) },
      ]
    : [];

  const handleSave = () => {
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Penghasilan", amount: result.zakatAmount, detail: detailRows });
    onCalculated();
    track("save", { type: "Penghasilan" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Penghasilan" });
    generateZakatPdf("Penghasilan", detailRows, result.zakatAmount, result.isWajib).catch(() =>
      toast.error("Gagal membuat PDF"),
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="penghasilan-bulanan" className="text-sm">Penghasilan Bulanan (Rp)</Label>
          <Input
            id="penghasilan-bulanan"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            value={monthly}
            onChange={(e) => formattedChange(e, setMonthly, formatNumberInput)}
            className="h-12 sm:h-10 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="penghasilan-bonus" className="text-sm">Bonus / THR Tahunan (Rp)</Label>
          <Input
            id="penghasilan-bonus"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            value={bonus}
            onChange={(e) => formattedChange(e, setBonus, formatNumberInput)}
            className="h-12 sm:h-10 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground font-medium">Metode Perhitungan</Label>
        <ToggleGroup
          type="single"
          value={method}
          onValueChange={(v) => v && setMethod(v as "bruto" | "netto")}
          className="w-full gap-0 rounded-lg border border-border/60 p-0.5"
        >
          <ToggleGroupItem value="bruto" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
            Bruto (kotor)
          </ToggleGroupItem>
          <ToggleGroupItem value="netto" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
            Netto (potong kebutuhan)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {method === "netto" && (
        <div className="space-y-2">
          <Label htmlFor="penghasilan-potongan" className="text-sm">Kebutuhan Pokok per Bulan (Rp)</Label>
          <Input
            id="penghasilan-potongan"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            value={deduction}
            onChange={(e) => formattedChange(e, setDeduction, formatNumberInput)}
            className="h-12 sm:h-10 text-base"
          />
          <p className="text-xs text-muted-foreground">Pendapat sebagian ulama: nafkah pokok boleh dipotong sebelum zakat.</p>
        </div>
      )}

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
            notWajibHint={`Penghasilan setahun belum mencapai nisab ${formatRupiah(result.nisab)}.`}
            onDownload={handleDownload}
            waType="Penghasilan"
          />
        )}
      </AnimatePresence>

      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
