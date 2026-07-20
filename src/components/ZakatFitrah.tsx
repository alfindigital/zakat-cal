import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcZakatFitrah, calcZakatFitrahUang, formatRupiah, addHistory, RICE_OPTIONS } from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { track } from "@/lib/analytics";
import { formatNumberInput, parseFormattedNumber, formattedChange } from "@/lib/format";
import { ResultCard, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";
import { focusFirstInvalid } from "@/lib/focus-invalid";
import { FieldError, ValidationSummary } from "@/components/ValidationHints";
import { getIdulFitriInfo } from "@/lib/ramadhan";
import { loadMazhab, MAZHAB_NOTES } from "@/lib/mazhab";
import { CalendarClock } from "lucide-react";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
  prefill?: Record<string, unknown>;
}

export default function ZakatFitrah({ isActive, onCalculated, prefill }: Props) {
  const [mode, setMode] = useState<"beras" | "uang">(() => (prefill?.mode as "beras" | "uang") ?? "beras");
  const [jiwa, setJiwa] = useState<string>(() => (prefill?.jiwa as string) ?? "");
  const [riceIdx, setRiceIdx] = useState<string>(() => (prefill?.riceIdx as string) ?? "0");
  const [customPrice, setCustomPrice] = useState<string>(() => (prefill?.customPrice as string) ?? "");
  const [perJiwaUang, setPerJiwaUang] = useState<string>(() => (prefill?.perJiwaUang as string) ?? "");
  const [attempted, setAttempted] = useState(false);


  const jiwaNum = Number(jiwa) || 0;
  const customPriceNum = parseFormattedNumber(customPrice);
  const perJiwaUangNum = parseFormattedNumber(perJiwaUang);
  const canCalc = mode === "beras" ? jiwaNum > 0 : jiwaNum > 0 && perJiwaUangNum > 0;

  const result = useMemo(() => {
    if (!canCalc) return null;
    if (mode === "beras") {
      const r = calcZakatFitrah(jiwaNum, Number(riceIdx), customPriceNum || undefined);
      return { total: r.total, perPerson: r.perPerson, kg: r.kg, pricePerKg: r.pricePerKg };
    }
    const r = calcZakatFitrahUang(jiwaNum, perJiwaUangNum);
    return { total: r.total, perPerson: r.perPerson, kg: 0, pricePerKg: 0 };
  }, [canCalc, mode, jiwaNum, riceIdx, customPriceNum, perJiwaUangNum]);

  const detailRows = result
    ? mode === "beras"
      ? [
          { label: `Per Jiwa (${result.kg} kg)`, value: formatRupiah(result.perPerson) },
          { label: "Harga Beras /kg", value: formatRupiah(result.pricePerKg) },
          { label: "Jumlah Jiwa", value: String(jiwaNum) },
        ]
      : [
          { label: "Per Jiwa (uang)", value: formatRupiah(result.perPerson) },
          { label: "Jumlah Jiwa", value: String(jiwaNum) },
        ]
    : [];

  const fields = [
    { id: "fitrah-jiwa", label: "Jumlah Jiwa", invalid: jiwaNum <= 0, message: "Isi jumlah anggota keluarga (minimal 1)." },
    { id: "fitrah-uang", label: "Tarif per Jiwa", invalid: mode === "uang" && perJiwaUangNum <= 0, message: "Isi tarif fitrah per jiwa sesuai daerah." },
  ];

  const handleSave = () => {
    setAttempted(true);
    if (focusFirstInvalid(fields)) return;
    if (!result) return;
    addHistory({ type: "Fitrah", amount: result.total, detail: detailRows, inputs: { mode, jiwa, riceIdx, customPrice, perJiwaUang } });
    onCalculated();
    track("save", { type: "Fitrah" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Fitrah" });
    generateZakatPdf("Fitrah", detailRows, result.total, true).catch(() => toast.error("Gagal membuat PDF"));
  };

  // Countdown ke 1 Syawal — hanya tampil bila dalam 60 hari agar tidak
  // mengganggu di luar musim Ramadhan.
  const idulFitri = useMemo(() => getIdulFitriInfo(), []);
  const showCountdown = idulFitri && idulFitri.daysLeft >= 0 && idulFitri.daysLeft <= 60;

  return (
    <div className="space-y-3 sm:space-y-4">
      {showCountdown && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <CalendarClock aria-hidden="true" className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {idulFitri!.daysLeft === 0
                ? "Hari ini 1 Syawal — segera tunaikan sebelum shalat Ied"
                : `Idul Fitri ${idulFitri!.hijriYear} H — H-${idulFitri!.daysLeft} hari lagi`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Zakat fitrah wajib ditunaikan sebelum shalat Idul Fitri.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground font-medium">Cara Membayar</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as "beras" | "uang")}
          className="w-full gap-0 rounded-lg border border-border/60 p-0.5"
        >
          <ToggleGroupItem value="beras" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
            🍚 Beras (2,5 kg)
          </ToggleGroupItem>
          <ToggleGroupItem value="uang" className="flex-1 text-sm h-10 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-semibold">
            💵 Uang (tarif daerah)
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-[11px] text-muted-foreground leading-snug">{MAZHAB_NOTES[loadMazhab()].fitrah}</p>
      </div>


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
            aria-invalid={attempted && fields[0].invalid}
            aria-describedby={attempted && fields[0].invalid ? "fitrah-jiwa-error" : undefined}
            className="h-12 sm:h-10 text-base"
          />
          {attempted && <FieldError id="fitrah-jiwa" message={fields[0].invalid ? fields[0].message : undefined} />}
        </div>

        {mode === "beras" ? (
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
        ) : (
          <div className="space-y-2">
            <Label htmlFor="fitrah-uang" className="text-sm">Tarif per Jiwa (Rp)</Label>
            <Input
              id="fitrah-uang"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              placeholder="contoh 45.000"
              value={perJiwaUang}
              onChange={(e) => formattedChange(e, setPerJiwaUang, formatNumberInput)}
              aria-invalid={attempted && fields[1].invalid}
              aria-describedby={attempted && fields[1].invalid ? "fitrah-uang-error" : undefined}
              className="h-12 sm:h-10 text-base"
            />
            {attempted && <FieldError id="fitrah-uang" message={fields[1].invalid ? fields[1].message : undefined} />}
          </div>
        )}
      </div>

      {mode === "beras" && (
        <div className="space-y-2">
          <Label htmlFor="fitrah-custom" className="text-sm">Harga Beras Kustom /kg (Rp) — opsional</Label>
          <Input
            id="fitrah-custom"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="kosongkan untuk pakai preset"
            value={customPrice}
            onChange={(e) => formattedChange(e, setCustomPrice, formatNumberInput)}
            className="h-12 sm:h-10 text-base"
          />
        </div>
      )}

      <ValidationSummary fields={fields} visible={attempted} />

      <div className="space-y-1.5">
        <Button onClick={handleSave} aria-disabled={!canCalc} className="w-full h-11">
          Simpan ke Riwayat
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground text-center">
          {canCalc ? "Perhitungan diperbarui otomatis di bawah." : "Isi jumlah jiwa untuk melihat perhitungan otomatis."}
        </p>
      </div>

      <AnimatePresence>
        {result && (
          <ResultCard
            rows={detailRows}
            amount={result.total}
            amountLabel="Total Zakat Fitrah"
            isWajib
            statusLabel="Wajib Ditunaikan"
            onDownload={handleDownload}
            waType="Fitrah"
          />
        )}
      </AnimatePresence>

      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
