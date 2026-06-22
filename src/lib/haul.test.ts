import { describe, it, expect, beforeEach } from "vitest";
import {
  LUNAR_YEAR_DAYS,
  haulEndDate,
  daysUntil,
  buildGoogleCalendarUrl,
  buildICS,
  addHaulReminder,
  getHaulReminders,
  removeHaulReminder,
  type HaulReminder,
} from "./haul";

const DAY = 86_400_000;

describe("haulEndDate — start + 1 tahun Hijriah (≈354 hari)", () => {
  it("menambah 354 hari dari tanggal mulai", () => {
    const start = new Date(2026, 0, 1); // 1 Jan 2026 lokal
    const end = haulEndDate("2026-01-01");
    expect(Math.round((end.getTime() - start.getTime()) / DAY)).toBe(LUNAR_YEAR_DAYS);
  });
});

describe("daysUntil", () => {
  it("tanggal 10 hari ke depan → 10", () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 10);
    expect(daysUntil(d)).toBe(10);
  });
  it("tanggal lampau → negatif", () => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    expect(daysUntil(d)).toBeLessThan(0);
  });
});

describe("ekspor kalender", () => {
  const r: HaulReminder = { id: "abc", label: "Tabungan", startDate: "2026-01-01" };

  it("Google Calendar URL berisi tanggal jatuh tempo & judul", () => {
    const url = buildGoogleCalendarUrl(r);
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("action=TEMPLATE");
    expect(decodeURIComponent(url)).toContain("Tabungan");
  });

  it(".ics valid berisi VEVENT, all-day, dan VALARM", () => {
    const ics = buildICS(r);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("UID:abc@zakatcal");
  });
});

describe("persistensi pengingat haul (localStorage)", () => {
  beforeEach(() => localStorage.clear());

  it("tambah & ambil", () => {
    addHaulReminder("Emas", "2026-03-01");
    const list = getHaulReminders();
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe("Emas");
    expect(list[0].id).toBeTruthy();
  });

  it("label kosong → default 'Harta saya'", () => {
    addHaulReminder("   ", "2026-03-01");
    expect(getHaulReminders()[0].label).toBe("Harta saya");
  });

  it("hapus per id", () => {
    addHaulReminder("A", "2026-03-01");
    const id = getHaulReminders()[0].id;
    removeHaulReminder(id);
    expect(getHaulReminders()).toHaveLength(0);
  });
});
