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
/**
 * Measure the height of the sticky top header (if any) so we can offset
 * scroll targets. Falls back to 0 on SSR / when the header is absent.
 */
function getStickyTopOffset(): number {
  if (typeof document === "undefined") return 0;
  // The app shell renders a single sticky <header> at the top of the page.
  const header = document.querySelector("header.sticky") as HTMLElement | null;
  const h = header?.getBoundingClientRect().height ?? 0;
  // Extra breathing room so the input isn't glued to the header edge.
  return Math.round(h) + 12;
}

/**
 * Scroll the window so `el` sits just below the sticky header. Uses
 * window.scrollTo (not scrollIntoView) so we can add an offset that
 * scrollIntoView cannot express, and so nested scroll containers don't
 * jump unexpectedly on mobile.
 */
function scrollWithOffset(el: HTMLElement) {
  if (typeof window === "undefined") return;
  const rect = el.getBoundingClientRect();
  const offset = getStickyTopOffset();
  const target = window.scrollY + rect.top - offset;
  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  window.scrollTo({
    top: Math.max(0, target),
    behavior: prefersReduced ? "auto" : "smooth",
  });
}

export function focusField(id: string): boolean {
  const el = document.getElementById(id) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLButtonElement
    | null;
  if (!el) return false;
  // Focus without letting the browser auto-scroll; we handle scroll
  // ourselves with the sticky-header offset applied.
  el.focus({ preventScroll: true });
  if ("select" in el && typeof (el as HTMLInputElement).select === "function") {
    try { (el as HTMLInputElement).select(); } catch { /* noop */ }
  }
  // Defer to the next frame so any newly-rendered inline error / summary
  // has laid out before we measure positions.
  requestAnimationFrame(() => scrollWithOffset(el));
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
