// Provider-agnostic, privacy-light event tracking.
//
// Wired to Google Analytics 4 (gtag) and Microsoft Clarity, whose scripts are
// loaded in index.html. We never send personal/financial values — only event
// names plus a coarse, non-identifying `type` (which zakat category). Safe to
// call even before the scripts finish loading (no-ops until then).

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, props?: Props) {
  if (typeof window === "undefined") return;
  try {
    // GA4 custom event.
    window.gtag?.("event", event, props ?? {});
    // Clarity custom event (name only) + optional type tag for segmentation.
    window.clarity?.("event", event);
    if (props?.type) window.clarity?.("set", "zakat_type", String(props.type));
  } catch {
    // analytics must never break the app
  }
}
