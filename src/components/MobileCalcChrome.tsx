import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Download, Info, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatRupiah, roundZakat, buildShareUrl, type ZakatType } from "@/lib/zakat";
import { buildZakatWaHref } from "@/lib/contact";
import { useRoundUp } from "@/lib/round-context";
import { track } from "@/lib/analytics";
import { LembagaZakatCta } from "./LembagaZakatCta";

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
  /** Zakat type — drives the prefilled WhatsApp message + analytics. */
  waType?: ZakatType;
  /** Shown when status is "not wajib" to explain why. */
  notWajibHint?: string;
}

export function ResultCard({
  rows,
  amount: rawAmount,
  amountLabel,
  isWajib,
  statusLabel,
  onDownload,
  waType,
  notWajibHint,
}: Props) {
  const isMobile = useIsMobile();
  const roundUp = useRoundUp();
  const [open, setOpen] = useState(false);
  // Apply the ihtiyat rounding reactively for the visible amount + CTA.
  const amount = roundZakat(rawAmount, roundUp);
  const showWa = !!waType && isWajib && amount > 0;

  const handleShare = async () => {
    const shareUrl =
      waType && amount > 0 && typeof location !== "undefined"
        ? buildShareUrl(location.href, { type: waType, amount, label: amountLabel })
        : typeof location !== "undefined"
          ? location.href
          : undefined;
    const text = `Estimasi zakat ${waType ?? ""}: ${formatRupiah(amount)} (via ZakatCal)`;
    track("share", { type: waType ?? "zakat" });
    try {
      if (navigator.share) {
        await navigator.share({ title: "ZakatCal", text, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${shareUrl ?? ""}`.trim());
      }
    } catch {
      /* user cancelled share — ignore */
    }

  };

  const WaCta = showWa ? (
    <a
      href={buildZakatWaHref(waType!, amount)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("pay_click", { type: waType! })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 h-11 sm:h-10 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Send aria-hidden="true" className="h-5 w-5" />
      Tunaikan {formatRupiah(amount)}
    </a>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border bg-muted/50 p-3.5 sm:p-4 space-y-2.5"
    >
      {/* Headline: always visible */}
      <div className="space-y-2">
        {statusLabel !== undefined && (
          <Badge
            variant={isWajib ? "default" : "secondary"}
            className={`text-xs inline-flex items-center gap-1 border ${
              isWajib
                ? "border-primary/40 ring-1 ring-primary/30"
                : "border-border ring-1 ring-border"
            }`}
          >
            {isWajib ? (
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">{isWajib ? "Status: " : "Status: "}</span>
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
        {!isWajib && notWajibHint && (
          <p className="text-xs text-muted-foreground">{notWajibHint}</p>
        )}
      </div>

      {/* Primary conversion CTA */}
      {WaCta}

      {/* Legitimate zakat institutions — only show once the calc says wajib. */}
      {showWa && <LembagaZakatCta waType={waType} />}



      {/* Details: collapsible on mobile, always open on desktop */}
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full rounded-lg border h-10 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" /> Bagikan
          </button>
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
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={onDownload}
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" /> Bagikan
            </Button>
          </div>
        </div>
      )}
    </motion.div>
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
      type="button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      aria-label="Download PDF hasil zakat"
      className="md:hidden fixed right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        bottom: "calc(9rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <Download aria-hidden="true" className="h-6 w-6" />
    </motion.button>,
    document.body,
  );
}
