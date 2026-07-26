import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Briefcase, Wallet, Wheat, Store, Sprout, Beef, Gem, Mountain, Moon, Download, Upload, FileDown, Eye, ChevronRight, Search, X } from "lucide-react";
import {
  type ZakatHistory,
  type ZakatType,
  formatRupiah,
  getHistory,
  removeHistory,
  restoreHistory,
  clearHistory,
  restoreAllHistory,
  importHistory,
  historyItemDate,
} from "@/lib/zakat";
import { generateZakatPdf } from "@/lib/pdf-generator";
// Recharts is heavy — load the chart lazily so it stays out of the initial bundle.
const ZakatChart = lazy(() => import("./ZakatChart"));
import HistoryDetailDialog from "./HistoryDetailDialog";
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
  Fidyah: Moon,
};

function HistoryItem({
  h,
  onRemove,
  onExportPdf,
  onOpenDetail,
  isMobile,
}: {
  h: ZakatHistory;
  onRemove: () => void;
  onExportPdf: () => void;
  onOpenDetail: () => void;
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
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Lihat detail riwayat ${h.type} ${formatRupiah(h.amount)}`}
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                {h.type}
              </Badge>
              {h.inputs && (
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">
                  · dapat diedit
                </span>
              )}
            </div>
            <p className="font-semibold text-sm sm:text-base text-primary truncate mt-0.5">
              {formatRupiah(h.amount)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{h.date}</p>
          </div>
        </button>
        {!isMobile ? (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              aria-label="Lihat detail"
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onOpenDetail}
            >
              <Eye aria-hidden="true" className="h-4 w-4" />
            </Button>
            {h.detail && h.detail.length > 0 && (
              <Button
                aria-label="Unduh PDF riwayat"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={onExportPdf}
              >
                <FileDown aria-hidden="true" className="h-4 w-4" />
              </Button>
            )}
            <Button
              aria-label="Hapus riwayat"
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </motion.div>
    </div>
  );
}


const ZAKAT_TYPES: ZakatType[] = [
  "Penghasilan",
  "Maal",
  "Fitrah",
  "Perniagaan",
  "Pertanian",
  "Peternakan",
  "Rikaz",
  "Madin",
  "Fidyah",
];

export default function ZakatRiwayat({ history, onChanged }: Props) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isRiwayatPage = location.pathname === "/riwayat";
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearSnapshot, setClearSnapshot] = useState<ZakatHistory[]>([]);
  const [detailItem, setDetailItem] = useState<ZakatHistory | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Filters (only exposed on /riwayat; home page shows full recent list).
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredHistory = useMemo(() => {
    if (!isRiwayatPage) return history;
    const q = query.trim().toLowerCase();
    return history.filter((h) => {
      if (typeFilter !== "all" && h.type !== typeFilter) return false;
      const hDate = historyItemDate(h);
      hDate.setHours(0, 0, 0, 0);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (hDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (hDate > end) return false;
      }
      if (q) {
        const haystack = [
          h.type,
          h.label,
          formatRupiah(h.amount),
          ...(h.detail?.flatMap((d) => [d.label, d.value]) ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [history, isRiwayatPage, query, typeFilter, startDate, endDate]);

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const activeFilters = query || typeFilter !== "all" || startDate || endDate;

  const yearTotal = useMemo(() => {
    const year = String(new Date().getFullYear());
    return filteredHistory.filter((h) => h.date.includes(year)).reduce((s, h) => s + h.amount, 0);
  }, [filteredHistory]);

  // On the home page, keep the embedded list compact — show the 5 latest and
  // link to /riwayat for the full experience. On /riwayat, show everything.
  const displayed = isRiwayatPage ? filteredHistory : history.slice(0, 5);
  const hasMore = !isRiwayatPage && history.length > displayed.length;

  const noResults = isRiwayatPage && filteredHistory.length === 0 && history.length > 0;


  const handleRemove = (item: ZakatHistory) => {
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

  const handleExportPdf = (item: ZakatHistory) => {
    generateZakatPdf(item.type, item.detail ?? [], item.amount, true).catch(() =>
      toast.error("Gagal membuat PDF"),
    );
  };

  const handleExportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(getHistory(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `riwayat-zakat-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Riwayat diekspor");
    } catch {
      toast.error("Gagal mengekspor riwayat");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importHistory(Array.isArray(data) ? data : [], "merge");
        onChanged();
        toast.success("Riwayat diimpor");
      } catch {
        toast.error("File tidak valid");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

  if (history.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <Suspense fallback={<div className="h-[180px] rounded-xl border bg-card animate-pulse" />}>
        <ZakatChart history={filteredHistory} />
      </Suspense>

      {/* Total zakat tahun berjalan */}
      <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total Zakat Anda Tahun {new Date().getFullYear()}</p>
          <p className="text-xl font-bold text-primary tabular-nums mt-0.5">{formatRupiah(yearTotal)}</p>
        </div>
      </div>

      {isRiwayatPage && (
        <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Cari & Filter</p>
            {activeFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={resetFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Cari jenis, jumlah, label, rincian..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 text-sm h-10"
                aria-label="Cari riwayat"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger aria-label="Filter jenis zakat" className="h-10 text-sm">
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                {ZAKAT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Rentang tanggal</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="Tanggal mulai"
                  className="text-sm h-10"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="Tanggal akhir"
                  className="text-sm h-10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base sm:text-lg font-semibold">
          Riwayat Perhitungan
          {isRiwayatPage && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filteredHistory.length} / {history.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-9" onClick={handleExportJson} aria-label="Ekspor riwayat">
            <Download className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Ekspor</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => fileRef.current?.click()} aria-label="Impor riwayat">
            <Upload className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Impor</span>
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-9" onClick={handleClearAll}>
            Hapus Semua
          </Button>
        </div>
      </div>
      {isMobile && !noResults && (
        <p className="text-[11px] text-muted-foreground -mt-2">
          Geser ke kiri untuk menghapus item
        </p>
      )}

      {noResults ? (
        <div className="rounded-xl border border-dashed bg-card p-6 text-center space-y-2">
          <p className="text-sm font-medium">Tidak ada riwayat yang cocok</p>
          <p className="text-xs text-muted-foreground">
            Coba ubah kata kunci, jenis zakat, atau rentang tanggal.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
            <X className="h-3.5 w-3.5 mr-1.5" />
            Hapus filter
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((h) => (
            <HistoryItem
              key={h.id}
              h={h}
              isMobile={isMobile}
              onRemove={() => handleRemove(h)}
              onExportPdf={() => handleExportPdf(h)}
              onOpenDetail={() => setDetailItem(h)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-1">
          <Button asChild variant="outline" className="w-full">
            <Link to="/riwayat" aria-label="Lihat semua riwayat perhitungan zakat">
              Lihat semua riwayat ({history.length})
            </Link>
          </Button>
        </div>
      )}

      <HistoryDetailDialog
        item={detailItem}
        open={!!detailItem}
        onOpenChange={(v) => !v && setDetailItem(null)}
      />

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
