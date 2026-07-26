// Default prices per gram in IDR (fallback, approx. mid-2026 levels — user editable)
export const DEFAULT_GOLD_PRICE = 2_000_000;
export const DEFAULT_SILVER_PRICE = 28_000;
const NISAB_GOLD_GRAMS = 85;
const NISAB_SILVER_GRAMS = 595;
const ZAKAT_RATE = 0.025;
const FITRAH_KG = 2.5;

export type NisabType = "gold" | "silver";

export function getNisabGrams(type: NisabType) {
  return type === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
}

export const RICE_OPTIONS = [
  { label: "Beras Standar", pricePerKg: 16_000 },
  { label: "Beras Premium", pricePerKg: 22_000 },
];

// Generate a stable id even where crypto.randomUUID is unavailable
// (older browsers / insecure HTTP contexts).
export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type PriceSource = "manual" | "online" | "default";

export interface GoldPrice {
  price: number;
  date: string;
  isDefault: boolean;
}

export interface StoredPrices {
  gold: number;
  silver: number;
  date: string;
  source: PriceSource;
}

const PRICE_KEY = "zakat-prices";

function todayId(): string {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Load user-persisted prices (manual override survives reloads). Falls back to
// sensible defaults when nothing is stored.
export function loadStoredPrices(): StoredPrices {
  const fallback: StoredPrices = {
    gold: DEFAULT_GOLD_PRICE,
    silver: DEFAULT_SILVER_PRICE,
    date: todayId(),
    source: "default",
  };
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PRICE_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<StoredPrices>;
    return {
      gold: typeof p.gold === "number" && p.gold > 0 ? p.gold : DEFAULT_GOLD_PRICE,
      silver: typeof p.silver === "number" && p.silver > 0 ? p.silver : DEFAULT_SILVER_PRICE,
      date: p.date || todayId(),
      source: p.source || "manual",
    };
  } catch {
    return fallback;
  }
}

export function saveStoredPrices(gold: number, silver: number, source: PriceSource = "manual") {
  if (typeof localStorage === "undefined") return;
  const data: StoredPrices = { gold, silver, date: todayId(), source };
  try {
    localStorage.setItem(PRICE_KEY, JSON.stringify(data));
  } catch {
    // storage full / blocked — non-fatal
  }
}

export function hasStoredPrices(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(PRICE_KEY) !== null;
  } catch {
    return false;
  }
}

// Best-effort online refresh of the gold price. Used only when the user
// explicitly asks (button / pull-to-refresh) — manual values are never
// silently overwritten on load.
export async function fetchGoldPrice(): Promise<GoldPrice> {
  // Combine XAU spot (USD/troy oz) with a live USD→IDR rate, then convert to
  // per-gram. Both endpoints are free, CORS-open, and require no API key.
  try {
    const [xauRes, fxRes] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", { headers: { Accept: "application/json" } }),
      fetch("https://api.exchangerate-api.com/v4/latest/USD", { headers: { Accept: "application/json" } }),
    ]);
    if (xauRes.ok && fxRes.ok) {
      const xau = await xauRes.json();
      const fx = await fxRes.json();
      const usdPerOz = Number(xau?.price);
      const idrPerUsd = Number(fx?.rates?.IDR);
      if (usdPerOz > 0 && idrPerUsd > 0) {
        const perGram = (usdPerOz * idrPerUsd) / 31.1035;
        return { price: perGram, date: todayId(), isDefault: false };
      }
    }
  } catch {
    /* fall through to fallback */
  }
  return { price: loadStoredPrices().gold, date: todayId(), isDefault: true };
}


// ===== Auto-update preference =====
const AUTO_UPDATE_KEY = "zakat-auto-update-gold";
export function loadAutoUpdate(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    const v = localStorage.getItem(AUTO_UPDATE_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}
export function saveAutoUpdate(on: boolean) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AUTO_UPDATE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getNisab(metalPrice: number, type: NisabType = "gold") {
  const grams = type === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  return grams * metalPrice;
}

export function calcZakatPenghasilan(
  monthlyIncome: number,
  annualBonus: number,
  metalPrice: number,
  nisabType: NisabType = "gold",
  monthlyDeduction = 0,
) {
  const grossAnnual = monthlyIncome * 12 + annualBonus;
  // Optional "netto" method: subtract basic-needs deduction before zakat.
  const deductionAnnual = Math.max(0, monthlyDeduction) * 12;
  const annualIncome = Math.max(0, grossAnnual - deductionAnnual);
  const nisab = getNisab(metalPrice, nisabType);
  const nisabLabel = nisabType === "gold" ? "85g emas" : "595g perak";
  const isWajib = annualIncome >= nisab;
  const zakatAmount = isWajib ? annualIncome * ZAKAT_RATE : 0;
  const zakatMonthly = zakatAmount / 12;
  return { annualIncome, grossAnnual, nisab, nisabLabel, isWajib, zakatAmount, zakatMonthly };
}

export function calcZakatMaal(
  tabungan: number,
  emasGram: number,
  perakGram: number,
  investasi: number,
  properti: number,
  hutang: number,
  goldPrice: number,
  silverPrice: number = DEFAULT_SILVER_PRICE,
  nisabType: NisabType = "gold"
) {
  const emasValue = emasGram * goldPrice;
  const perakValue = perakGram * silverPrice;
  const totalHarta = tabungan + emasValue + perakValue + investasi + properti;
  const hartaBersih = Math.max(0, totalHarta - hutang);
  const metalPrice = nisabType === "gold" ? goldPrice : silverPrice;
  const nisab = getNisab(metalPrice, nisabType);
  const nisabLabel = nisabType === "gold" ? "85g emas" : "595g perak";
  const isWajib = hartaBersih >= nisab;
  const zakatAmount = isWajib ? hartaBersih * ZAKAT_RATE : 0;
  return { totalHarta, hartaBersih, emasValue, perakValue, nisab, nisabLabel, isWajib, zakatAmount };
}

export function calcZakatFitrah(jumlahJiwa: number, riceIndex: number, customPricePerKg?: number) {
  const pricePerKg =
    typeof customPricePerKg === "number" && customPricePerKg > 0
      ? customPricePerKg
      : RICE_OPTIONS[riceIndex]?.pricePerKg ?? RICE_OPTIONS[0].pricePerKg;
  const perPerson = FITRAH_KG * pricePerKg;
  const total = perPerson * jumlahJiwa;
  return { perPerson, total, kg: FITRAH_KG, pricePerKg };
}

// Pay fitrah directly in cash (e.g. BAZNAS regional tariff) — flat Rp per jiwa.
export function calcZakatFitrahUang(jumlahJiwa: number, perJiwa: number) {
  const perPerson = Math.max(0, perJiwa);
  const total = perPerson * Math.max(0, jumlahJiwa);
  return { perPerson, total };
}

// ===== Fidyah (denda puasa yang ditinggalkan) =====
// 1 mud (~0,75 kg) makanan pokok per hari yang ditinggalkan. Banyak lembaga
// mematok nilai uang per hari. Default mengikuti takaran beras.
export const FIDYAH_KG_PER_DAY = 0.75;
export function calcFidyah(jumlahHari: number, hargaPerHari: number) {
  const days = Math.max(0, jumlahHari);
  const perDay = Math.max(0, hargaPerHari);
  const total = days * perDay;
  return { days, perDay, total, kgPerDay: FIDYAH_KG_PER_DAY };
}

// ===== Zakat Perniagaan / Tijarah =====
// Modal kerja + piutang lancar + stok dagang − hutang dagang jangka pendek
// Nisab: 85g emas. Kadar: 2.5%. Haul: 1 tahun.
export function calcZakatPerniagaan(
  modal: number,
  piutang: number,
  stok: number,
  hutangDagang: number,
  goldPrice: number,
) {
  const totalAset = modal + piutang + stok;
  const hartaBersih = Math.max(0, totalAset - hutangDagang);
  const nisab = NISAB_GOLD_GRAMS * goldPrice;
  const isWajib = hartaBersih >= nisab;
  const zakatAmount = isWajib ? hartaBersih * ZAKAT_RATE : 0;
  return { totalAset, hartaBersih, nisab, isWajib, zakatAmount };
}

// ===== Zakat Pertanian =====
// Nisab: 653 kg hasil panen (5 wasaq). Kadar: 5% (irigasi/biaya), 10% (tadah hujan).
// Tidak ada haul — dibayar saat panen.
const NISAB_PERTANIAN_KG = 653;
export type IrrigationType = "tadah_hujan" | "irigasi";
export function calcZakatPertanian(
  hasilPanenKg: number,
  hargaPerKg: number,
  irrigation: IrrigationType,
) {
  const rate = irrigation === "tadah_hujan" ? 0.1 : 0.05;
  const nisabKg = NISAB_PERTANIAN_KG;
  const isWajib = hasilPanenKg >= nisabKg;
  const zakatKg = isWajib ? hasilPanenKg * rate : 0;
  const totalValue = hasilPanenKg * hargaPerKg;
  const zakatAmount = zakatKg * hargaPerKg;
  return { nisabKg, rate, isWajib, zakatKg, zakatAmount, totalValue };
}

// ===== Zakat Peternakan =====
export type LivestockType = "kambing" | "sapi" | "unta";

interface LivestockTier {
  min: number;
  max: number;
  zakat: string;
  count: number;
}

const LIVESTOCK_TABLES: Record<LivestockType, LivestockTier[]> = {
  kambing: [
    { min: 40, max: 120, zakat: "1 ekor kambing (umur ≥1 th)", count: 1 },
    { min: 121, max: 200, zakat: "2 ekor kambing", count: 2 },
    { min: 201, max: 399, zakat: "3 ekor kambing", count: 3 },
    { min: 400, max: Infinity, zakat: "1 ekor kambing tiap kelipatan 100", count: 4 },
  ],
  sapi: [
    { min: 30, max: 39, zakat: "1 ekor tabi' (umur 1 th)", count: 1 },
    { min: 40, max: 59, zakat: "1 ekor musinnah (umur 2 th)", count: 1 },
    { min: 60, max: 69, zakat: "2 ekor tabi'", count: 2 },
    { min: 70, max: Infinity, zakat: "1 tabi' + 1 musinnah tiap 30/40 ekor", count: 2 },
  ],
  unta: [
    { min: 5, max: 9, zakat: "1 ekor kambing", count: 1 },
    { min: 10, max: 14, zakat: "2 ekor kambing", count: 2 },
    { min: 15, max: 19, zakat: "3 ekor kambing", count: 3 },
    { min: 20, max: 24, zakat: "4 ekor kambing", count: 4 },
    { min: 25, max: 35, zakat: "1 ekor bintu makhad (umur 1 th)", count: 1 },
    { min: 36, max: 45, zakat: "1 ekor bintu labun (umur 2 th)", count: 1 },
    { min: 46, max: 60, zakat: "1 ekor hiqqah (umur 3 th)", count: 1 },
    { min: 61, max: 75, zakat: "1 ekor jaza'ah (umur 4 th)", count: 1 },
    { min: 76, max: 90, zakat: "2 ekor bintu labun", count: 2 },
    { min: 91, max: Infinity, zakat: "2 ekor hiqqah, lalu naik bertahap", count: 2 },
  ],
};

export function calcZakatPeternakan(jumlahHewan: number, type: LivestockType, hargaPerEkor: number) {
  const table = LIVESTOCK_TABLES[type];
  const tier = table.find((t) => jumlahHewan >= t.min && jumlahHewan <= t.max);
  const minNisab = table[0].min;
  const isWajib = jumlahHewan >= minNisab;
  const zakatDescription = isWajib && tier ? tier.zakat : `Belum mencapai nisab (min ${minNisab} ekor)`;
  const zakatAmount = isWajib && tier ? tier.count * hargaPerEkor : 0;
  return { isWajib, minNisab, zakatDescription, zakatAmount, tierCount: tier?.count ?? 0 };
}

// ===== Zakat Rikaz (Harta Temuan / Karun) =====
// Tanpa nisab, tanpa haul. Kadar: 20% (1/5).
export function calcZakatRikaz(nilaiHarta: number) {
  const rate = 0.2;
  const isWajib = nilaiHarta > 0;
  const zakatAmount = nilaiHarta * rate;
  return { rate, isWajib, zakatAmount };
}

// ===== Zakat Ma'din (Hasil Tambang) =====
// Jumhur: nisab 85g emas, kadar 2.5%. Tidak perlu haul.
export function calcZakatMadin(nilaiHasilTambang: number, goldPrice: number) {
  const nisab = NISAB_GOLD_GRAMS * goldPrice;
  const isWajib = nilaiHasilTambang >= nisab;
  const zakatAmount = isWajib ? nilaiHasilTambang * ZAKAT_RATE : 0;
  return { nisab, isWajib, zakatAmount };
}

export type ZakatType =
  | "Penghasilan"
  | "Maal"
  | "Fitrah"
  | "Perniagaan"
  | "Pertanian"
  | "Peternakan"
  | "Rikaz"
  | "Madin"
  | "Fidyah";

export interface HistoryDetailRow {
  label: string;
  value: string;
}

export interface ZakatHistory {
  id: string;
  date: string;
  type: ZakatType;
  amount: number;
  /** Optional snapshot of the calculation breakdown, for re-export / review. */
  detail?: HistoryDetailRow[];
  /** Optional user-supplied note/label. */
  label?: string;
  /**
   * Optional raw input snapshot so the calculator can be re-opened with the
   * previous values pre-filled ("edit ulang"). Shape is per-calculator; keep
   * to serialisable primitives (string/number/boolean).
   */
  inputs?: Record<string, unknown>;
  /** ISO timestamp used for date-range filtering (newer entries). */
  createdAt?: string;
}

const ID_MONTHS: Record<string, number> = {
  Januari: 0,
  Februari: 1,
  Maret: 2,
  April: 3,
  Mei: 4,
  Juni: 5,
  Juli: 6,
  Agustus: 7,
  September: 8,
  Oktober: 9,
  November: 10,
  Desember: 11,
};

/**
 * Extract a usable Date from a history entry. Prefer the ISO `createdAt`
 * field; fall back to parsing the Indonesian locale `date` string for
 * backwards compatibility with older entries.
 */
export function historyItemDate(item: ZakatHistory): Date {
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Parse "26 Juli 2026" produced by toLocaleDateString("id-ID", ...).
  const parts = item.date.split(" ");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = ID_MONTHS[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!Number.isNaN(day) && month !== undefined && !Number.isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date(0);
}

const STORAGE_KEY = "zakat-history";
const HISTORY_EVENT = "zakat-history-changed";

function emitHistoryChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
}

/**
 * Subscribe to history changes from this tab (custom event) AND other tabs (storage event).
 * Returns an unsubscribe function.
 */
export function subscribeHistory(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb();
  };
  const onLocal = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(HISTORY_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(HISTORY_EVENT, onLocal);
  };
}

export function getHistory(): ZakatHistory[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<ZakatHistory, "id" | "date" | "createdAt">) {
  const history = getHistory();
  const now = new Date();
  history.unshift({
    ...entry,
    amount: roundZakat(entry.amount),
    id: uid(),
    date: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    createdAt: now.toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  emitHistoryChange();
}


// Replace the whole history list (used by Import). Newest-first invariant kept.
export function importHistory(items: ZakatHistory[], mode: "merge" | "replace" = "merge") {
  if (!Array.isArray(items)) return;
  const sanitized: ZakatHistory[] = items
    .filter((i) => i && typeof i.amount === "number" && typeof i.type === "string")
    .map((i) => ({
      id: typeof i.id === "string" && i.id ? i.id : uid(),
      date: typeof i.date === "string" ? i.date : todayId(),
      type: i.type,
      amount: i.amount,
      detail: Array.isArray(i.detail) ? i.detail : undefined,
      label: typeof i.label === "string" ? i.label : undefined,
      inputs: i.inputs && typeof i.inputs === "object" ? i.inputs : undefined,
      createdAt: typeof i.createdAt === "string" ? i.createdAt : undefined,
    }));
  let merged: ZakatHistory[] = sanitized;
  if (mode === "merge") {
    const current = getHistory();
    const seen = new Set(current.map((c) => c.id));
    merged = [...sanitized.filter((s) => !seen.has(s.id)), ...current];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 50)));
  emitHistoryChange();
}

export function removeHistory(id: string) {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  emitHistoryChange();
}

/**
 * Re-insert a previously removed entry (Undo).
 * Uses anchor ids to find the correct slot even if the list mutated since removal:
 *   1. Insert AFTER `predecessorId` if it still exists.
 *   2. Otherwise insert BEFORE `successorId` if it still exists.
 *   3. Otherwise fall back to the clamped original index.
 */
export function restoreHistory(
  entry: ZakatHistory,
  fallbackIndex: number,
  anchors?: { predecessorId?: string | null; successorId?: string | null },
) {
  const history = getHistory();
  if (history.some((h) => h.id === entry.id)) return; // already present

  let idx = -1;
  if (anchors?.predecessorId) {
    const pIdx = history.findIndex((h) => h.id === anchors.predecessorId);
    if (pIdx !== -1) idx = pIdx + 1;
  }
  if (idx === -1 && anchors?.successorId) {
    const sIdx = history.findIndex((h) => h.id === anchors.successorId);
    if (sIdx !== -1) idx = sIdx;
  }
  if (idx === -1) idx = Math.max(0, Math.min(fallbackIndex, history.length));

  history.splice(idx, 0, entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  emitHistoryChange();
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  emitHistoryChange();
}

/**
 * Restore a previously cleared list (Undo "Hapus Semua").
 * Merges with any items added after the clear so we don't drop new work.
 * New items are placed at the top (newest-first invariant), snapshot follows.
 */
export function restoreAllHistory(items: ZakatHistory[]) {
  if (!items?.length) return;
  const current = getHistory();
  const snapshotIds = new Set(items.map((i) => i.id));
  const additions = current.filter((c) => !snapshotIds.has(c.id));
  const merged = [...additions, ...items];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 50)));
  emitHistoryChange();
}




export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ===== Pembulatan ihtiyat (kehati-hatian) =====
// Optional: round the final zakat amount UP to the nearest Rp 1.000.
const ROUNDUP_KEY = "zakat-roundup";

export function loadRoundUp(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    const v = localStorage.getItem(ROUNDUP_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function saveRoundUp(on: boolean) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(ROUNDUP_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function roundZakat(amount: number, on = loadRoundUp()): number {
  if (!on || amount <= 0) return amount;
  return Math.ceil(amount / 1000) * 1000;
}

// ===== LocalStorage schema versioning =====
// Bumped whenever the on-disk shape of any zakat-* key changes so we can run
// future migrations safely. `migrateStorage` is idempotent and cheap; safe to
// call on every app mount.
export const SCHEMA_VERSION = 1;
const SCHEMA_KEY = "zakat-schema-version";

export function migrateStorage(): number {
  if (typeof localStorage === "undefined") return SCHEMA_VERSION;
  try {
    const raw = localStorage.getItem(SCHEMA_KEY);
    const current = raw ? Number(raw) : 0;
    if (current === SCHEMA_VERSION) return current;
    // v0 -> v1: no destructive change; just stamp the version so future
    // migrations know the baseline shape.
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    return SCHEMA_VERSION;
  } catch {
    return SCHEMA_VERSION;
  }
}

// ===== Shareable result deep-links =====
// Encoded into a single `?share=` query param so a user can send a link that,
// when opened, greets the recipient with the exact zakat total and type.
export interface SharedResult {
  type: ZakatType;
  amount: number;
  label?: string;
}

export function encodeSharedResult(r: SharedResult): string {
  const payload = { t: r.type, a: Math.round(r.amount), l: r.label };
  try {
    // btoa is safe for our ASCII-only JSON payload here.
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return "";
  }
}

export function decodeSharedResult(token: string): SharedResult | null {
  if (!token) return null;
  try {
    const json = decodeURIComponent(escape(atob(token)));
    const p = JSON.parse(json);
    if (!p || typeof p.t !== "string" || typeof p.a !== "number") return null;
    return { type: p.t as ZakatType, amount: p.a, label: typeof p.l === "string" ? p.l : undefined };
  } catch {
    return null;
  }
}

export function buildShareUrl(base: string, r: SharedResult): string {
  const token = encodeSharedResult(r);
  if (!token) return base;
  try {
    const url = new URL(base, typeof location !== "undefined" ? location.href : "https://example.com");
    url.searchParams.set("share", token);
    return url.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}share=${encodeURIComponent(token)}`;
  }
}

