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
import { FieldError, ValidationSummary } from "@/components/ValidationHints";

interface Props {
  metalPrice: number;
  nisabType: NisabType;
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

export default function ZakatPenghasilan({ metalPrice, nisabType, isActive, onCalculated, prefill }: Props) {
  const [monthly, setMonthly] = useState<string>(() => (prefill?.monthly as string) ?? "");
  const [bonus, setBonus] = useState<string>(() => (prefill?.bonus as string) ?? "");
  const [method, setMethod] = useState<"bruto" | "netto">(() => (prefill?.method as "bruto" | "netto") ?? "bruto");
  const [deduction, setDeduction] = useState<string>(() => (prefill?.deduction as string) ?? "");
  const [attempted, setAttempted] = useState(false);


  const monthlyNum = parseFormattedNumber(monthly);
  const deductionNum = method === "netto" ? parseFormattedNumber(deduction) : 0;
  const canCalc = monthlyNum > 0;

  const fields = [
    {
      id: "penghasilan-bulanan",
      label: "Penghasilan Bulanan",
      invalid: monthlyNum <= 0,
      message: "Isi penghasilan bulanan lebih dari 0.",
    },
  ];

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
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Penghasilan", amount: result.zakatAmount, detail: detailRows, inputs: { monthly, bonus, method, deduction } });
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
            aria-invalid={attempted && fields[0].invalid}
            aria-describedby={attempted && fields[0].invalid ? "penghasilan-bulanan-error" : undefined}
            className="h-12 sm:h-10 text-base"
          />
          {attempted && <FieldError id="penghasilan-bulanan" message={fields[0].invalid ? fields[0].message : undefined} />}
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

      <ValidationSummary fields={fields} visible={attempted} />

      <div className="space-y-1.5">
        <Button onClick={handleSave} aria-disabled={!canCalc} className="w-full h-11">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi field wajib untuk melihat perhitungan otomatis."}
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
