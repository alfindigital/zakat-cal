import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { type ZakatHistory, formatRupiah, removeHistory, clearHistory } from "@/lib/zakat";

interface Props {
  history: ZakatHistory[];
  onChanged: () => void;
}

export default function ZakatRiwayat({ history, onChanged }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Riwayat Perhitungan</h2>
        <Button variant="ghost" size="sm" onClick={() => { clearHistory(); onChanged(); }}>
          Hapus Semua
        </Button>
      </div>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{h.type}</Badge>
              <div>
                <p className="font-medium text-primary">{formatRupiah(h.amount)}</p>
                <p className="text-xs text-muted-foreground">{h.date}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { removeHistory(h.id); onChanged(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
