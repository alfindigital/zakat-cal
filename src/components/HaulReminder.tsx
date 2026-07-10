import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CalendarPlus, Download, Trash2, Plus, Calendar } from "lucide-react";
import {
  type HaulReminder as HaulReminderT,
  getHaulReminders,
  addHaulReminder,
  removeHaulReminder,
  subscribeHaul,
  haulEndDate,
  daysUntil,
  formatDateID,
  buildGoogleCalendarUrl,
  downloadICS,
} from "@/lib/haul";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function countdownBadge(end: Date) {
  const days = daysUntil(end);
  if (days < 0) return { text: "Lewat jatuh tempo", variant: "destructive" as const };
  if (days === 0) return { text: "Jatuh tempo hari ini", variant: "default" as const };
  if (days <= 30) return { text: `${days} hari lagi`, variant: "default" as const };
  return { text: `${days} hari lagi`, variant: "secondary" as const };
}

interface Props {
  /** When true, render without the outer Card chrome (e.g. inside the settings dialog). */
  embedded?: boolean;
}

export default function HaulReminder({ embedded = false }: Props) {
  const [list, setList] = useState<HaulReminderT[]>(getHaulReminders());
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(todayISO());

  useEffect(() => subscribeHaul(() => setList(getHaulReminders())), []);

  const handleAdd = () => {
    if (!date) return;
    addHaulReminder(label, date);
    setLabel("");
    setDate(todayISO());
    track("haul_add");
    toast.success("Pengingat haul ditambahkan");
  };

  const body = (
    <div className="space-y-4">
      {list.length > 0 && (
        <ul className="space-y-3">
          {list.map((r) => {
            const end = haulEndDate(r.startDate);
            const badge = countdownBadge(end);
            return (
              <li key={r.id} className="space-y-2 rounded-2xl border border-border bg-muted/50 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">Jatuh tempo: {formatDateID(end)}</p>
                  </div>
                  <Badge variant={badge.variant} className="shrink-0 text-[10px]">{badge.text}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button asChild variant="outline" size="sm" className="h-7 text-[11px] sm:h-8 sm:text-xs">
                    <a
                      href={buildGoogleCalendarUrl(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("haul_calendar", { method: "google" })}
                    >
                      <CalendarPlus className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Google Calendar
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] sm:h-8 sm:text-xs"
                    onClick={() => { downloadICS(r); track("haul_calendar", { method: "ics" }); }}
                  >
                    <Download className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> .ics
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-7 w-7 text-destructive hover:bg-destructive/10 sm:h-8 sm:w-8"
                    aria-label="Hapus pengingat haul"
                    onClick={() => removeHaulReminder(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="haul-label" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
              Nama
            </Label>
            <Input
              id="haul-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="mis. Hartaku"
              className="h-11 w-full border-border bg-muted text-sm text-card-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20 sm:h-12"
              maxLength={40}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="haul-date" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
              Tanggal mulai (capai nisab)
            </Label>
            <div className="relative">
              <Input
                id="haul-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full border-border bg-muted pr-10 text-sm text-card-foreground focus-visible:border-primary focus-visible:ring-primary/20 sm:h-12"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={!date} className="h-11 w-full gap-1 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] sm:h-12 sm:w-auto">
          <Plus className="h-4 w-4" /> Tambah pengingat
        </Button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <Label className="text-sm font-semibold text-card-foreground">Pengingat Haul</Label>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <CalendarClock className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-semibold text-card-foreground sm:text-base">Pengingat Haul</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
        Haul = 1 tahun Hijriah (±354 hari) sejak harta mencapai nisab. Catat tanggal mulainya, kami ingatkan saat jatuh tempo.
      </p>
      {body}
    </div>
  );
}
