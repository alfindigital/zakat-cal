import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatMaal, formatRupiah, addHistory, type NisabType } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formatQuantityInput, parseQuantity, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";
import { ValidationSummary } from "@/components/ValidationHints";

interface Props {
  goldPrice: number;
  silverPrice: number;
  nisabType: NisabType;
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

export default function ZakatMaal({ goldPrice, silverPrice, nisabType, isActive, onCalculated, prefill }: Props) {
  const [tabungan, setTabungan] = useState<string>(() => (prefill?.tabungan as string) ?? "");
  const [emas, setEmas] = useState<string>(() => (prefill?.emas as string) ?? "");
  const [perak, setPerak] = useState<string>(() => (prefill?.perak as string) ?? "");
  const [investasi, setInvestasi] = useState<string>(() => (prefill?.investasi as string) ?? "");
  const [properti, setProperti] = useState<string>(() => (prefill?.properti as string) ?? "");
  const [hutang, setHutang] = useState<string>(() => (prefill?.hutang as string) ?? "");
  const [attempted, setAttempted] = useState(false);


  const tabunganNum = parseFormattedNumber(tabungan);
  const emasNum = parseQuantity(emas);
  const perakNum = parseQuantity(perak);
  const investasiNum = parseFormattedNumber(investasi);
  const propertiNum = parseFormattedNumber(properti);
  const hutangNum = parseFormattedNumber(hutang);

  const canCalc = tabunganNum + emasNum + perakNum + investasiNum + propertiNum > 0;

  const result = useMemo(
    () =>
      canCalc
        ? calcZakatMaal(tabunganNum, emasNum, perakNum, investasiNum, propertiNum, hutangNum, goldPrice, silverPrice, nisabType)
        : null,
    [canCalc, tabunganNum, emasNum, perakNum, investasiNum, propertiNum, hutangNum, goldPrice, silverPrice, nisabType],
  );

  const detailRows = result
    ? [
        { label: "Total Harta", value: formatRupiah(result.totalHarta) },
        { label: "Hutang", value: formatRupiah(result.totalHarta - result.hartaBersih) },
        { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
        { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
      ]
    : [];

  const fields = [
    {
      id: "maal-tabungan",
      label: "Salah satu harta (tabungan / emas / perak / investasi / properti)",
      invalid: !canCalc,
      message: "Isi minimal salah satu jenis harta.",
    },
  ];

  const handleSave = () => {
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result) return;
    addHistory({ type: "Maal", amount: result.zakatAmount, detail: detailRows, inputs: { tabungan, emas, perak, investasi, properti, hutang } });
    onCalculated();
    track("save", { type: "Maal" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Maal" });
    generateZakatPdf(
      "Maal",
      [
        { label: "Tabungan", value: formatRupiah(tabunganNum) },
        { label: "Nilai Emas", value: formatRupiah(result.emasValue) },
        { label: "Nilai Perak", value: formatRupiah(result.perakValue) },
        { label: "Investasi / Saham / Kripto", value: formatRupiah(investasiNum) },
        { label: "Properti Investasi", value: formatRupiah(propertiNum) },
        { label: "Total Harta", value: formatRupiah(result.totalHarta) },
        { label: "Hutang", value: formatRupiah(result.totalHarta - result.hartaBersih) },
        { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
        { label: "Nisab (" + result.nisabLabel + ")", value: formatRupiah(result.nisab) },
      ],
      result.zakatAmount,
      result.isWajib,
    ).catch(() => toast.error("Gagal membuat PDF"));
  };

  const numField = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    quantity = false,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => formattedChange(e, set, quantity ? formatQuantityInput : formatNumberInput)}
        className="h-11 sm:h-10 text-base"
      />
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid gap-4 sm:gap-4 sm:grid-cols-2">
        {numField("maal-tabungan", "Tabungan (Rp)", tabungan, setTabungan)}
        {numField("maal-emas", "Emas (gram)", emas, setEmas, true)}
        {numField("maal-perak", "Perak (gram)", perak, setPerak, true)}
        {numField("maal-investasi", "Investasi / Saham / Kripto (Rp)", investasi, setInvestasi)}
        {numField("maal-properti", "Properti Investasi (Rp)", properti, setProperti)}
        {numField("maal-hutang", "Hutang (Rp)", hutang, setHutang)}
      </div>

      <p className="text-xs text-muted-foreground">
        Catatan: menurut sebagian ulama, emas perhiasan yang wajar dipakai sehari-hari tidak dizakati — masukkan hanya emas simpanan/investasi.
      </p>

      <ValidationSummary fields={fields} visible={attempted} />

      <div className="space-y-1.5">
        <Button onClick={handleSave} className="w-full h-11 sm:h-10">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi salah satu harta untuk melihat perhitungan otomatis."}
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
            notWajibHint={`Harta bersih belum mencapai nisab ${formatRupiah(result.nisab)}.`}
            onDownload={handleDownload}
            waType="Maal"
          />
        )}
      </AnimatePresence>

      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
