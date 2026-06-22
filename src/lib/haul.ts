import { uid } from "./zakat";

// Haul = one Hijri (lunar) year of continuous ownership. A lunar year is
// ~354.37 days; we use 354 as a documented practical approximation.
export const LUNAR_YEAR_DAYS = 354;

export interface HaulReminder {
  id: string;
  label: string;
  /** Date ownership reached nisab, ISO "YYYY-MM-DD". */
  startDate: string;
}

const STORAGE_KEY = "zakat-haul";
const EVENT = "zakat-haul-changed";

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeHaul(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb();
  };
  const onLocal = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onLocal);
  };
}

export function getHaulReminders(): HaulReminder[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addHaulReminder(label: string, startDate: string) {
  const list = getHaulReminders();
  list.unshift({ id: uid(), label: label.trim() || "Harta saya", startDate });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
  emit();
}

export function removeHaulReminder(id: string) {
  const list = getHaulReminders().filter((h) => h.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  emit();
}

// Parse an ISO date string as a local (not UTC) calendar date.
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function haulEndDate(startISO: string): Date {
  const start = parseLocalDate(startISO);
  start.setDate(start.getDate() + LUNAR_YEAR_DAYS);
  return start;
}

// Whole days from today (local midnight) until the given date.
// Negative = already past due.
export function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatDateID(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

const SUMMARY = (label: string) => `Zakat: haul "${label}" jatuh tempo`;
const DETAILS =
  "Harta Anda telah mencapai 1 tahun (haul). Saatnya menghitung & menunaikan zakat. — ZakatCal";

// Google Calendar "add event" link (all-day on the haul date).
export function buildGoogleCalendarUrl(r: HaulReminder): string {
  const end = haulEndDate(r.startDate);
  const next = new Date(end);
  next.setDate(next.getDate() + 1); // Google treats all-day end as exclusive
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: SUMMARY(r.label),
    dates: `${ymd(end)}/${ymd(next)}`,
    details: DETAILS,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Downloadable .ics with a reminder alarm — works with Apple/Outlook/Google.
export function buildICS(r: HaulReminder): string {
  const end = haulEndDate(r.startDate);
  const next = new Date(end);
  next.setDate(next.getDate() + 1);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZakatCal//Haul//ID",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${r.id}@zakatcal`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(end)}`,
    `DTEND;VALUE=DATE:${ymd(next)}`,
    `SUMMARY:${SUMMARY(r.label)}`,
    `DESCRIPTION:${DETAILS}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${SUMMARY(r.label)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(r: HaulReminder) {
  try {
    const blob = new Blob([buildICS(r)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `haul-${r.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}
