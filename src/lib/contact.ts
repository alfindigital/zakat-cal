// Contact channel — Telegram: t.me/alfindigital
export const TELEGRAM_HANDLE = "alfindigital";
export const TELEGRAM_BASE = `https://t.me/${TELEGRAM_HANDLE}`;

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
  return `${TELEGRAM_BASE}?text=${encodeURIComponent(msg)}`;
}

export const buildZakatTelegramHref = buildZakatWaHref;
