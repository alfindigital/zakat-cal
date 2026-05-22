import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { type ZakatHistory, formatRupiah, removeHistory, clearHistory } from "@/lib/zakat";
import ZakatChart from "./ZakatChart";

interface Props {
  history: ZakatHistory[];
  onChanged: () => void;
}

export default function ZakatRiwayat({ history, onChanged }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <ZakatChart history={history} />

      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">Riwayat Perhitungan</h2>
        <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={() => { clearHistory(); onChanged(); }}>
          Hapus Semua
        </Button>
      </div>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="flex items-center justify-between rounded-lg border bg-card p-2.5 sm:p-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">{h.type}</Badge>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base text-primary truncate">{formatRupiah(h.amount)}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{h.date}</p>
              </div>
            </div>
            <Button aria-label="Hapus riwayat" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { removeHistory(h.id); onChanged(); }}>
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
