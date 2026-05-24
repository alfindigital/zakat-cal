// Format a numeric input string with Indonesian thousand separators (e.g. "10000000" -> "10.000.000").
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
