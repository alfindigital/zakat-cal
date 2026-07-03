/**
 * Idul Fitri countdown for the Zakat Fitrah tab.
 *
 * Uses `Intl.DateTimeFormat` with the `islamic-umalqura` calendar (widely
 * supported in modern browsers and Node) to convert *today* into Hijri. That
 * gives us the current Hijri year, which we then project forward to the next
 * 1 Syawal — the day Idul Fitri is prayed and the deadline for Zakat Fitrah.
 *
 * We approximate the Gregorian date of "1 Syawal <year> H" by scanning a small
 * date window and finding the first Gregorian day whose Hijri representation
 * is 1/10/<year>. This avoids pulling in a full Hijri library.
 *
 * If anything fails (older browsers, exotic locales), we return `null` and the
 * caller falls back to hiding the banner — never crash the calculator.
 */

const HIJRI_LOCALE = "en-US-u-ca-islamic-umalqura";

interface HijriParts {
  day: number;
  month: number;
  year: number;
}

function toHijri(date: Date): HijriParts | null {
  try {
    const fmt = new Intl.DateTimeFormat(HIJRI_LOCALE, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    // Output like "10/1/1446 AH" or "1/10/1446 AH" depending on ICU — parse defensively.
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    const day = Number(get("day"));
    const month = Number(get("month"));
    const year = Number(get("year"));
    if (!day || !month || !year) return null;
    return { day, month, year };
  } catch {
    return null;
  }
}

/** Find the Gregorian Date whose Hijri equivalent is 1 Syawal `hijriYear`. */
function findGregorianForSyawal1(hijriYear: number): Date | null {
  // Anchor: pick any date and step forward day-by-day until we find 1 Syawal.
  // Ramadhan/Syawal always lands in a predictable ~30-day window relative to
  // the Gregorian year, so we scan a 400-day window starting today.
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    const h = toHijri(d);
    if (h && h.year === hijriYear && h.month === 10 && h.day === 1) return d;
    // Also handle year rollover — the *next* Idul Fitri belongs to hijriYear+? 
    if (h && h.month === 10 && h.day === 1 && h.year >= hijriYear) return d;
  }
  return null;
}

export interface IdulFitriInfo {
  /** Days remaining until 1 Syawal (0 = today, negative = past). */
  daysLeft: number;
  /** e.g. "1446 H". */
  hijriYear: number;
  /** Gregorian ISO date for the countdown UI. */
  target: Date;
  /** True while inside Ramadhan (Hijri month 9). */
  inRamadhan: boolean;
}

export function getIdulFitriInfo(now: Date = new Date()): IdulFitriInfo | null {
  const today = toHijri(now);
  if (!today) return null;
  // Target = the *next* 1 Syawal. If we're already past 1 Syawal this year,
  // the scan will keep going and land on next year's Syawal automatically.
  const target = findGregorianForSyawal1(today.year);
  if (!target) return null;
  const msPerDay = 86_400_000;
  const startOfDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const daysLeft = Math.round((startOfDay(target) - startOfDay(now)) / msPerDay);
  return {
    daysLeft,
    hijriYear: today.year,
    target,
    inRamadhan: today.month === 9,
  };
}
