import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CalendarPlus, Download, Trash2, Plus } from "lucide-react";
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
    <div className="space-y-3">
      {list.length > 0 && (
        <ul className="space-y-2">
          {list.map((r) => {
            const end = haulEndDate(r.startDate);
            const badge = countdownBadge(end);
            return (
              <li key={r.id} className="rounded-lg border bg-card p-2.5 sm:p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate sm:text-sm">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground sm:text-[11px]">Jatuh tempo: {formatDateID(end)}</p>
                  </div>
                  <Badge variant={badge.variant} className="text-[9px] shrink-0 sm:text-[10px]">{badge.text}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button asChild variant="outline" size="sm" className="h-7 text-[11px] sm:h-8 sm:text-xs">
                    <a
                      href={buildGoogleCalendarUrl(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("haul_calendar", { method: "google" })}
                    >
                      <CalendarPlus className="h-3 w-3 mr-1 sm:h-3.5 sm:w-3.5" /> Google Calendar
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] sm:h-8 sm:text-xs"
                    onClick={() => { downloadICS(r); track("haul_calendar", { method: "ics" }); }}
                  >
                    <Download className="h-3 w-3 mr-1 sm:h-3.5 sm:w-3.5" /> .ics
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto sm:h-8 sm:w-8"
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

      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="haul-label" className="text-[11px] sm:text-xs">Nama</Label>
            <Input
              id="haul-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="mis. Hartaku"
              className="h-9 text-xs w-full sm:h-10 sm:text-sm"
              maxLength={40}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="haul-date" className="text-[11px] sm:text-xs">Tanggal mulai (capai nisab)</Label>
            <Input
              id="haul-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs w-full sm:h-10 sm:text-sm"
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={!date} className="h-9 w-full text-xs sm:h-10 sm:w-auto sm:text-sm">
          <Plus className="h-3.5 w-3.5 mr-1 sm:h-4 sm:w-4" /> Tambah pengingat
        </Button>
      </div>

    </div>
  );

  if (embedded) {
    return <div className="space-y-2">{body}</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" /> Pengingat Haul
        </CardTitle>
        <p className="text-[11px] text-muted-foreground sm:text-xs">
          Haul = 1 tahun Hijriah (±354 hari) sejak harta mencapai nisab. Catat tanggal mulainya, kami ingatkan saat jatuh tempo.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">{body}</CardContent>
    </Card>
  );
}
