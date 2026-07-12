import { toast } from "sonner";

/**
 * Focus the first field in `fields` whose value is empty/zero.
 * Returns true when a field was focused (i.e. validation failed).
 * Used so the primary action button stays keyboard-reachable even when
 * inputs are incomplete — instead of being `disabled`, the click routes
 * the user straight to the field that needs attention.
 */
export function focusFirstInvalid(
  fields: { id: string; label: string; invalid: boolean }[],
): boolean {
  const first = fields.find((f) => f.invalid);
  if (!first) return false;
  const el = document.getElementById(first.id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) {
    el.focus({ preventScroll: false });
    if ("select" in el && typeof el.select === "function") {
      try { el.select(); } catch { /* noop */ }
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  toast.error("Lengkapi field wajib", { description: `Isi "${first.label}" terlebih dahulu.` });
  return true;
}
