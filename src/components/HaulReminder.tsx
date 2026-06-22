import { useEffect, useRef, useState } from "react";
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

export default function HaulReminder() {
  const [list, setList] = useState<HaulReminderT[]>(getHaulReminders());
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(todayISO());
  const notified = useRef(false);

  useEffect(() => subscribeHaul(() => setList(getHaulReminders())), []);

  // In-app reminder: alert once per session when a haul is due/overdue.
  useEffect(() => {
    if (notified.current) return;
    const due = list.filter((r) => daysUntil(haulEndDate(r.startDate)) <= 0);
    if (due.length > 0) {
      notified.current = true;
      toast.info("Haul jatuh tempo", {
        description: `${due.length} harta sudah mencapai haul — saatnya menghitung zakat.`,
        duration: 8000,
      });
    }
  }, [list]);

  const handleAdd = () => {
    if (!date) return;
    addHaulReminder(label, date);
    setLabel("");
    setDate(todayISO());
    track("haul_add");
    toast.success("Pengingat haul ditambahkan");
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" /> Pengingat Haul
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Haul = 1 tahun Hijriah (±354 hari) sejak harta mencapai nisab. Catat tanggal mulainya, kami ingatkan saat jatuh tempo.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5 space-y-3">
        {list.length > 0 && (
          <ul className="space-y-2">
            {list.map((r) => {
              const end = haulEndDate(r.startDate);
              const badge = countdownBadge(end);
              return (
                <li key={r.id} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Jatuh tempo: {formatDateID(end)}
                      </p>
                    </div>
                    <Badge variant={badge.variant} className="text-[10px] shrink-0">{badge.text}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <a
                        href={buildGoogleCalendarUrl(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("haul_calendar", { method: "google" })}
                      >
                        <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Google Calendar
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { downloadICS(r); track("haul_calendar", { method: "ics" }); }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> .ics
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-auto"
                      aria-label="Hapus pengingat haul"
                      onClick={() => removeHaulReminder(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="haul-label" className="text-xs">Nama harta (opsional)</Label>
              <Input
                id="haul-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="mis. Tabungan"
                className="h-10 text-sm"
                maxLength={40}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="haul-date" className="text-xs">Tanggal mulai (capai nisab)</Label>
              <Input
                id="haul-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!date} className="h-10">
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
