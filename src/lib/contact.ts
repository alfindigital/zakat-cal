// Contact channel — configure VITE_TELEGRAM_HANDLE in your .env file
// e.g. VITE_TELEGRAM_HANDLE=your_telegram_handle
export const TELEGRAM_HANDLE: string =
  import.meta.env.VITE_TELEGRAM_HANDLE ?? "";
export const TELEGRAM_BASE = TELEGRAM_HANDLE
  ? `https://t.me/${TELEGRAM_HANDLE}`
  : "";

// Kept for compatibility (still linked from a few places); points to Telegram now.
export const WA_NUMBER = TELEGRAM_HANDLE;
export const WA_BASE = TELEGRAM_BASE;

import { formatRupiah, type ZakatType } from "@/lib/zakat";

// Telegram deep-link with a prefilled message. Telegram supports ?text= via
// t.me/<user>?text=... (rendered as a pre-typed message when the app opens).
export function buildZakatWaHref(type: ZakatType, amount: number): string {
  const msg =
    `Assalamualaikum, saya ingin menunaikan Zakat ${type} ` +
    `sebesar ${formatRupiah(amount)}. Mohon informasinya. (via ZakatCal)`;
  if (!TELEGRAM_BASE) return "#";
  return `${TELEGRAM_BASE}?text=${encodeURIComponent(msg)}`;
}

export const buildZakatTelegramHref = buildZakatWaHref;
