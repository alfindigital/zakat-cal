import { toast } from "sonner";

export interface ValidationField {
  id: string;
  label: string;
  invalid: boolean;
  /** Optional custom message. Falls back to a generic hint. */
  message?: string;
}

/**
 * Focus a field by id, select its content, and scroll it into view.
 * Exported so inline error links can reuse the same behavior as the
 * Save-button validation flow.
 */
export function focusField(id: string): boolean {
  const el = document.getElementById(id) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLButtonElement
    | null;
  if (!el) return false;
  el.focus({ preventScroll: false });
  if ("select" in el && typeof (el as HTMLInputElement).select === "function") {
    try { (el as HTMLInputElement).select(); } catch { /* noop */ }
  }
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

/**
 * Focus the first invalid field. Returns true when validation failed
 * (i.e. the caller should abort the submit).
 */
export function focusFirstInvalid(fields: ValidationField[]): boolean {
  const first = fields.find((f) => f.invalid);
  if (!first) return false;
  focusField(first.id);
  toast.error("Lengkapi field wajib", {
    description: `Isi "${first.label}" terlebih dahulu.`,
  });
  return true;
}
