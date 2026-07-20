import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calcZakatPerniagaan, formatRupiah, addHistory } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";
import { ValidationSummary } from "@/components/ValidationHints";

interface Props {
  goldPrice: number;
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

export default function ZakatPerniagaan({ goldPrice, isActive, onCalculated, prefill }: Props) {
  const [modal, setModal] = useState<string>(() => (prefill?.modal as string) ?? "");
  const [piutang, setPiutang] = useState<string>(() => (prefill?.piutang as string) ?? "");
  const [stok, setStok] = useState<string>(() => (prefill?.stok as string) ?? "");
  const [hutang, setHutang] = useState<string>(() => (prefill?.hutang as string) ?? "");
  const [attempted, setAttempted] = useState(false);


  const modalN = parseFormattedNumber(modal);
  const piutangN = parseFormattedNumber(piutang);
  const stokN = parseFormattedNumber(stok);
  const hutangN = parseFormattedNumber(hutang);
  const canCalc = modalN + piutangN + stokN > 0;

  const result = useMemo(
    () => (canCalc ? calcZakatPerniagaan(modalN, piutangN, stokN, hutangN, goldPrice) : null),
    [canCalc, modalN, piutangN, stokN, hutangN, goldPrice],
  );

  const detailRows = result
    ? [
        { label: "Total Aset", value: formatRupiah(result.totalAset) },
        { label: "Hutang Dagang", value: formatRupiah(hutangN) },
        { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
        { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
      ]
    : [];

  const fields = [
    {
      id: "perniagaan-modal",
      label: "Modal Kerja / Piutang / Stok Dagang",
      invalid: !canCalc,
      message: "Isi minimal salah satu: modal kerja, piutang, atau stok dagang.",
    },
  ];

  const handleSave = () => {
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result || result.zakatAmount <= 0) return;
    addHistory({ type: "Perniagaan", amount: result.zakatAmount, detail: detailRows, inputs: { modal, piutang, stok, hutang } });
    onCalculated();
    track("save", { type: "Perniagaan" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Perniagaan" });
    generateZakatPdf("Perniagaan", [
      { label: "Modal Kerja", value: formatRupiah(modalN) },
      { label: "Piutang Lancar", value: formatRupiah(piutangN) },
      { label: "Stok Dagang", value: formatRupiah(stokN) },
      { label: "Hutang Dagang", value: formatRupiah(hutangN) },
      { label: "Total Aset", value: formatRupiah(result.totalAset) },
      { label: "Harta Bersih", value: formatRupiah(result.hartaBersih) },
      { label: "Nisab (85g emas)", value: formatRupiah(result.nisab) },
    ], result.zakatAmount, result.isWajib).catch(() => toast.error("Gagal membuat PDF"));
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Input id={id} type="text" inputMode="decimal" pattern="[0-9]*" placeholder="0"
        value={value} onChange={(e) => formattedChange(e, set, formatNumberInput)}
        className="h-12 sm:h-10 text-base" />
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("perniagaan-modal", "Modal Kerja (Rp)", modal, setModal)}
        {field("perniagaan-piutang", "Piutang Lancar (Rp)", piutang, setPiutang)}
        {field("perniagaan-stok", "Stok Dagang (Rp)", stok, setStok)}
        {field("perniagaan-hutang", "Hutang Dagang (Rp)", hutang, setHutang)}
      </div>
      <p className="text-xs text-muted-foreground">
        <strong>Modal kerja</strong> = kas/uang usaha. <strong>Piutang lancar</strong> = tagihan yang akan tertagih. <strong>Stok dagang</strong> = nilai barang dagangan. <strong>Hutang dagang</strong> = kewajiban jangka pendek usaha.
      </p>
      <ValidationSummary fields={fields} visible={attempted} />
      <div className="space-y-1.5">
        <Button onClick={handleSave} aria-disabled={!canCalc} className="w-full h-11">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi modal/piutang/stok untuk melihat perhitungan otomatis."}
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
            waType="Perniagaan"
          />
        )}
      </AnimatePresence>
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
