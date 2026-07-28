import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Pencil, ExternalLink } from "lucide-react";
import { formatRupiah, type ZakatHistory } from "@/lib/zakat";
import { getPageByTab } from "@/lib/seo";
import { generateZakatPdf } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface Props {
  item: ZakatHistory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map ZakatType (title-cased in history) → tab id used by SEO/router.
const TYPE_TO_TAB: Record<string, string> = {
  Penghasilan: "maal",
  Maal: "maal",
  Fitrah: "fitrah",
  Perniagaan: "perniagaan",
  Pertanian: "pertanian",
  Peternakan: "peternakan",
  Rikaz: "rikaz",
  Madin: "madin",
  Fidyah: "fidyah",
};

function pathForType(type: string): string {
  const tab = TYPE_TO_TAB[type];
  if (!tab) return "/";
  // "maal" is served by the home route ("/"), it has no standalone route.
  if (tab === "maal") return "/";
  const page = getPageByTab(tab);
  if (!page) return "/";
  return page.slug ? `/${page.slug}` : "/";
}

export default function HistoryDetailDialog({ item, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  if (!item) return null;

  const canEdit = !!item.inputs && Object.keys(item.inputs).length > 0;
  const targetPath = pathForType(item.type);

  const handleEdit = () => {
    onOpenChange(false);
    navigate(targetPath, {
      state: {
        prefill: item.inputs ?? {},
        fromHistoryId: item.id,
      },
    });
  };

  const handleOpenCalc = () => {
    onOpenChange(false);
    navigate(targetPath);
  };

  const handleExportPdf = () => {
    generateZakatPdf(item.type, item.detail ?? [], item.amount, true).catch(() =>
      toast.error("Gagal membuat PDF"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              Zakat {item.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{item.date}</span>
          </div>
          <DialogTitle className="text-xl text-primary tabular-nums">
            {formatRupiah(item.amount)}
          </DialogTitle>
          <DialogDescription>
            Rincian perhitungan yang tersimpan di riwayat.
          </DialogDescription>
        </DialogHeader>

        {item.detail && item.detail.length > 0 ? (
          <dl className="divide-y divide-border/60 rounded-lg border bg-muted/30">
            {item.detail.map((row, i) => (
              <div key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium text-right break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Rincian tidak tersedia untuk entri ini.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          {item.detail && item.detail.length > 0 && (
            <Button variant="outline" onClick={handleExportPdf} className="w-full sm:w-auto">
              <FileDown aria-hidden="true" className="h-4 w-4 mr-2" />
              Unduh PDF
            </Button>
          )}
          {canEdit ? (
            <Button onClick={handleEdit} className="w-full sm:w-auto">
              <Pencil aria-hidden="true" className="h-4 w-4 mr-2" />
              Edit ulang
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleOpenCalc} className="w-full sm:w-auto">
              <ExternalLink aria-hidden="true" className="h-4 w-4 mr-2" />
              Buka Kalkulator
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
