// Local number 089619093961 → international wa.me format (62...).
export const WA_NUMBER = "6289619093961";

export const WA_BASE = `https://wa.me/${WA_NUMBER}`;

import { formatRupiah, type ZakatType } from "@/lib/zakat";

// Build a WhatsApp deep-link with a prefilled, friendly Indonesian message that
// states the zakat type and the calculated amount, so the amil can follow up.
export function buildZakatWaHref(type: ZakatType, amount: number): string {
  const msg =
    `Assalamualaikum, saya ingin menunaikan Zakat ${type} ` +
    `sebesar ${formatRupiah(amount)}. Mohon informasinya. (via ZakatCal)`;
  return `${WA_BASE}?text=${encodeURIComponent(msg)}`;
}
