import { AlertCircle } from "lucide-react";
import { focusField, type ValidationField } from "@/lib/focus-invalid";

/**
 * Inline error hint rendered directly below an <Input>. The parent
 * component sets `aria-describedby={id + "-error"}` and
 * `aria-invalid={true}` on the input while this is visible so screen
 * readers announce the error alongside the field.
 */
export function FieldError({
  id,
  message,
  className = "",
}: {
  id: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={`${id}-error`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-1.5 text-xs text-destructive ${className}`}
    >
      <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );

}

/**
 * Ringkasan validasi di dekat tombol simpan. Setiap field yang invalid
 * ditampilkan sebagai tombol/link — klik akan memfokuskan input yang
 * bersangkutan (same behavior as pressing Save on an invalid form).
 */
export function ValidationSummary({
  fields,
  visible,
  title = "Perbaiki hal berikut:",
}: {
  fields: ValidationField[];
  visible: boolean;
  title?: string;
}) {
  const invalid = fields.filter((f) => f.invalid);
  if (!visible || invalid.length === 0) return null;
  return (
    <div
      role="region"
      aria-labelledby="validation-summary-title"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text"
      tabIndex={-1}
      className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm space-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60"
    >
      <p id="validation-summary-title" className="flex items-center gap-1.5 font-medium text-destructive">
        <AlertCircle aria-hidden="true" className="h-4 w-4" />
        {title}
      </p>
      <ul className="space-y-1 pl-5 list-disc marker:text-destructive/60" aria-label="Daftar field yang perlu diperbaiki">
        {invalid.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => focusField(f.id)}
              className="text-destructive underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60 rounded"
            >
              {f.label}
            </button>
            {f.message && (
              <span className="text-muted-foreground"> — {f.message}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
