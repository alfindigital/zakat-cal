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

interface Props {
  goldPrice: number;
  silverPrice: number;
  nisabType: NisabType;
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatMaal({ goldPrice, silverPrice, nisabType, isActive, onCalculated }: Props) {
  const [tabungan, setTabungan] = useState("");
  const [emas, setEmas] = useState("");
  const [perak, setPerak] = useState("");
  const [investasi, setInvestasi] = useState("");
  const [properti, setProperti] = useState("");
  const [hutang, setHutang] = useState("");

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

  const handleSave = () => {
    if (focusFirstInvalid([
      { id: "maal-tabungan", label: "salah satu harta (tabungan, emas, perak, investasi, atau properti)", invalid: !canCalc },
    ])) return;
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Maal", amount: result.zakatAmount, detail: detailRows });
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
        className="h-12 sm:h-10 text-base"
      />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
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
