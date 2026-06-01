import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Trash2, Briefcase, Wallet, Wheat, Store, Sprout, Beef, Gem, Mountain } from "lucide-react";
import {
  type ZakatHistory,
  formatRupiah,
  getHistory,
  removeHistory,
  restoreHistory,
  clearHistory,
  restoreAllHistory,
} from "@/lib/zakat";
import ZakatChart from "./ZakatChart";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface Props {
  history: ZakatHistory[];
  onChanged: () => void;
}

const TYPE_ICON: Record<string, typeof Briefcase> = {
  Penghasilan: Briefcase,
  Maal: Wallet,
  Fitrah: Wheat,
  Perniagaan: Store,
  Pertanian: Sprout,
  Peternakan: Beef,
  Rikaz: Gem,
  Madin: Mountain,
};

function HistoryItem({
  h,
  onRemove,
  isMobile,
}: {
  h: ZakatHistory;
  onRemove: () => void;
  isMobile: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const Icon = TYPE_ICON[h.type] ?? Briefcase;

  return (
    <div data-history-id={h.id} className="relative overflow-hidden rounded-lg">
      {/* Delete background, revealed on swipe (mobile only) */}
      {isMobile && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Hapus riwayat"
          className="absolute inset-y-0 right-0 w-20 bg-destructive text-destructive-foreground flex items-center justify-center"
        >
          <Trash2 aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
      <motion.div
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.15}
        animate={{ x: revealed ? -80 : 0 }}
        onDragEnd={(_, info) => setRevealed(info.offset.x < -40)}
        className="relative flex items-center justify-between rounded-lg border bg-card p-3 sm:p-3 min-h-[56px] touch-pan-y"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                {h.type}
              </Badge>
            </div>
            <p className="font-semibold text-sm sm:text-base text-primary truncate mt-0.5">
              {formatRupiah(h.amount)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{h.date}</p>
          </div>
        </div>
        {!isMobile && (
          <Button
            aria-label="Hapus riwayat"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </div>
  );
}

export default function ZakatRiwayat({ history, onChanged }: Props) {
  const isMobile = useIsMobile();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearSnapshot, setClearSnapshot] = useState<ZakatHistory[]>([]);

  if (history.length === 0) return null;

  const handleRemove = (item: ZakatHistory) => {
    // Snapshot index + neighbor ids so Undo can land on the right spot
    // even if the list mutates afterwards (other deletes, adds, cross-tab sync).
    const snapshot = getHistory();
    const idx = snapshot.findIndex((h) => h.id === item.id);
    const predecessorId = idx > 0 ? snapshot[idx - 1].id : null;
    const successorId = idx >= 0 && idx < snapshot.length - 1 ? snapshot[idx + 1].id : null;

    removeHistory(item.id);
    onChanged();

    toast.success("Riwayat dihapus", {
      description: `${item.type} • ${formatRupiah(item.amount)}`,
      duration: 5000,
      action: {
        label: "Urungkan",
        onClick: () => {
          restoreHistory(item, idx === -1 ? 0 : idx, { predecessorId, successorId });
          onChanged();
          toast.success("Riwayat dipulihkan");
        },
      },
    });
  };

  const handleClearAll = () => {
    const snapshot = getHistory();
    if (snapshot.length === 0) return;
    setClearSnapshot(snapshot);
    setShowClearDialog(true);
  };

  const handleConfirmClear = () => {
    setShowClearDialog(false);
    clearHistory();
    onChanged();

    toast.success("Semua riwayat dihapus", {
      description: `${clearSnapshot.length} item dihapus`,
      duration: 6000,
      action: {
        label: "Urungkan",
        onClick: () => {
          restoreAllHistory(clearSnapshot);
          onChanged();
          toast.success("Semua riwayat dipulihkan");
        },
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <ZakatChart history={history} />

      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">Riwayat Perhitungan</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm h-9"
          onClick={handleClearAll}
        >
          Hapus Semua
        </Button>
      </div>
      {isMobile && (
        <p className="text-[11px] text-muted-foreground -mt-2">
          Geser ke kiri untuk menghapus item
        </p>
      )}
      <div className="space-y-2">
        {history.map((h) => (
          <HistoryItem
            key={h.id}
            h={h}
            isMobile={isMobile}
            onRemove={() => handleRemove(h)}
          />
        ))}
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Riwayat?</AlertDialogTitle>
            <AlertDialogDescription>
              {clearSnapshot.length} item akan dihapus. Tindakan ini dapat diurungkan lewat notifikasi yang muncul.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
