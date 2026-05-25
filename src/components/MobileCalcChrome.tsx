import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatRupiah } from "@/lib/zakat";

export interface ResultRow {
  label: string;
  value: string;
}

interface Props {
  rows: ResultRow[];
  amount: number;
  amountLabel: string;
  isWajib?: boolean;
  statusLabel?: string;
  onDownload: () => void;
}

export function ResultCard({ rows, amount, amountLabel, isWajib, statusLabel, onDownload }: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border bg-muted/50 p-4 sm:p-5 space-y-3"
    >
      {/* Headline: always visible */}
      <div className="space-y-2">
        {statusLabel !== undefined && (
          <Badge variant={isWajib ? "default" : "secondary"} className="text-xs">
            {statusLabel}
          </Badge>
        )}
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{amountLabel}</p>
          <motion.p
            key={amount}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-3xl sm:text-2xl font-bold text-primary tabular-nums mt-1 leading-tight break-words"
          >
            {formatRupiah(amount)}
          </motion.p>
        </div>
      </div>

      {/* Details: collapsible on mobile, always open on desktop */}
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="result-details"
            className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground py-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <span>{open ? "Sembunyikan Detail" : "Lihat Detail"}</span>
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
                id="result-details"
                role="region"
                aria-label="Detail perhitungan"
              >
                <div className="border-t pt-3 space-y-2">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium tabular-nums">{r.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="border-t pt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium tabular-nums">{r.value}</span>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={onDownload}
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      )}
    </motion.div>
  );
}

interface MobileCtaProps {
  isActive: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function MobileCta({ isActive, label, disabled, onClick }: MobileCtaProps) {
  const isMobile = useIsMobile();
  if (!isMobile || !isActive || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="md:hidden fixed left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border/40 px-4 pt-3"
      style={{
        bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "0.75rem",
      }}
    >
      <Button onClick={onClick} disabled={disabled} className="w-full h-12 text-base font-semibold">
        {label}
      </Button>
    </div>,
    document.body,
  );
}

interface MobilePdfFabProps {
  isActive: boolean;
  visible: boolean;
  onClick: () => void;
}

export function MobilePdfFab({ isActive, visible, onClick }: MobilePdfFabProps) {
  const isMobile = useIsMobile();
  if (!isMobile || !isActive || !visible || typeof document === "undefined") return null;

  return createPortal(
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      aria-label="Download PDF"
      className="md:hidden fixed right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      style={{
        bottom: "calc(9rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <Download className="h-6 w-6" />
    </motion.button>,
    document.body,
  );
}
