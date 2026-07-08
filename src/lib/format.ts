// Format a numeric input string with Indonesian thousand separators (e.g. "10000000" -> "10.000.000").
// Currency fields are integers only — decimals are intentionally stripped.
export function formatNumberInput(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

// Parse a formatted number string back to a plain number.
export function parseFormattedNumber(val: string): number {
  if (!val) return 0;
  return Number(val.replace(/\D/g, "")) || 0;
}

// Format a metal price (gold / silver) per gram with Indonesian locale — always
// shows exactly 2 decimals and thousand separators, e.g. 1234567.5 -> "1.234.567,50".
export function formatMetalPrice(n: number): string {
  if (!Number.isFinite(n)) return "0,00";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ===== Quantity inputs (gram / kg / liter) — allow ONE decimal fraction =====
// Currency uses formatNumberInput above (integer only). Quantities like gold
// grams (2,5 gr) or harvest weight (1.234,5 kg) need a fractional part, so we
// keep a single decimal separator (Indonesian comma) plus thousand grouping.

// Normalise a raw quantity string: keep digits and at most one decimal comma.
// Optional maxDecimals caps the fractional part (e.g. 2 for metal prices).
export function formatQuantityInput(val: string, maxDecimals?: number): string {
  // Accept both "." and "," as the user's decimal mark while typing.
  const cleaned = val.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const firstComma = cleaned.indexOf(",");
  let intPart = firstComma === -1 ? cleaned : cleaned.slice(0, firstComma);
  let decPart = firstComma === -1 ? "" : cleaned.slice(firstComma + 1).replace(/,/g, "");

  intPart = intPart.replace(/\D/g, "");
  decPart = decPart.replace(/\D/g, "");

  if (maxDecimals !== undefined && decPart.length > maxDecimals) {
    decPart = decPart.slice(0, maxDecimals);
  }

  const grouped = intPart ? new Intl.NumberFormat("id-ID").format(Number(intPart)) : "";

  if (firstComma === -1) return grouped;
  // Preserve a trailing comma so the user can keep typing the decimal part.
  return `${grouped || "0"},${decPart}`;
}

// Parse a formatted quantity string ("1.234,5") back to a number (1234.5).
export function parseQuantity(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Reformat an input on change WHILE preserving the caret position, so editing
// in the middle of a grouped number ("10.0|00") doesn't jump the cursor to the
// end. Caret is anchored to the count of significant chars (digits + comma)
// before it, which survives the thousand-separator reshuffle.
export function formattedChange(
  e: { target: HTMLInputElement },
  set: (v: string) => void,
  format: (s: string) => string,
) {
  const el = e.target;
  const oldVal = el.value;
  const caret = el.selectionStart ?? oldVal.length;
  const sigBefore = oldVal.slice(0, caret).replace(/[^\d,]/g, "").length;
  const formatted = format(oldVal);
  set(formatted);

  requestAnimationFrame(() => {
    if (!el.isConnected) return;
    let pos = 0;
    let seen = 0;
    while (pos < formatted.length && seen < sigBefore) {
      if (/[\d,]/.test(formatted[pos])) seen++;
      pos++;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      /* not all input types support selection */
    }
  });
}
