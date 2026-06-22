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
import { ResultCard, MobileCta, MobilePdfFab } from "./MobileCalcChrome";
import { toast } from "sonner";

interface Props {
  isActive: boolean;
  onCalculated: () => void;
}

export default function ZakatFitrah({ isActive, onCalculated }: Props) {
  const [mode, setMode] = useState<"beras" | "uang">("beras");
  const [jiwa, setJiwa] = useState("");
  const [riceIdx, setRiceIdx] = useState("0");
  const [customPrice, setCustomPrice] = useState("");
  const [perJiwaUang, setPerJiwaUang] = useState("");

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

  const handleSave = () => {
    if (!result) return;
    addHistory({ type: "Fitrah", amount: result.total, detail: detailRows });
    onCalculated();
    track("save", { type: "Fitrah" });
    toast.success("Tersimpan ke riwayat");
  };

  const handleDownload = () => {
    if (!result) return;
    track("download_pdf", { type: "Fitrah" });
    generateZakatPdf("Fitrah", detailRows, result.total, true).catch(() => toast.error("Gagal membuat PDF"));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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
            className="h-12 sm:h-10 text-base"
          />
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
              className="h-12 sm:h-10 text-base"
            />
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

      <Button onClick={handleSave} disabled={!canCalc} className="w-full h-11 hidden md:inline-flex">
        Simpan ke Riwayat
      </Button>

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

      <MobileCta isActive={isActive} label="Simpan ke Riwayat" disabled={!canCalc} onClick={handleSave} />
      <MobilePdfFab isActive={isActive} visible={!!result} onClick={handleDownload} />
    </div>
  );
}
