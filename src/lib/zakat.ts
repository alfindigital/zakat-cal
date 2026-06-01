// Default prices per gram in IDR (fallback)
const DEFAULT_GOLD_PRICE = 1_200_000;
export const DEFAULT_SILVER_PRICE = 15_000;
const NISAB_GOLD_GRAMS = 85;
const NISAB_SILVER_GRAMS = 595;
const ZAKAT_RATE = 0.025;
const FITRAH_KG = 2.5;

export type NisabType = "gold" | "silver";

export function getNisabGrams(type: NisabType) {
  return type === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
}

export const RICE_OPTIONS = [
  { label: "Beras Standar", pricePerKg: 14_000 },
  { label: "Beras Premium", pricePerKg: 18_000 },
];

export interface GoldPrice {
  price: number;
  date: string;
  isDefault: boolean;
}

export async function fetchGoldPrice(): Promise<GoldPrice> {
  try {
    const res = await fetch("https://api.metals.dev/v1/latest?api_key=demo&currency=IDR&unit=gram");
    if (res.ok) {
      const data = await res.json();
      if (data?.metals?.gold) {
        return {
          price: Math.round(data.metals.gold),
          date: new Date().toLocaleDateString("id-ID"),
          isDefault: false,
        };
      }
    }
  } catch {
    // fallback
  }
  return { price: DEFAULT_GOLD_PRICE, date: new Date().toLocaleDateString("id-ID"), isDefault: true };
}

export function getNisab(metalPrice: number, type: NisabType = "gold") {
  const grams = type === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
  return grams * metalPrice;
}

export function calcZakatPenghasilan(monthlyIncome: number, annualBonus: number, metalPrice: number, nisabType: NisabType = "gold") {
  const annualIncome = monthlyIncome * 12 + annualBonus;
  const nisab = getNisab(metalPrice, nisabType);
  const nisabLabel = nisabType === "gold" ? "85g emas" : "595g perak";
  const isWajib = annualIncome >= nisab;
  const zakatAmount = isWajib ? annualIncome * ZAKAT_RATE : 0;
  return { annualIncome, nisab, nisabLabel, isWajib, zakatAmount };
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

export function calcZakatFitrah(jumlahJiwa: number, riceIndex: number) {
  const pricePerKg = RICE_OPTIONS[riceIndex]?.pricePerKg ?? RICE_OPTIONS[0].pricePerKg;
  const perPerson = FITRAH_KG * pricePerKg;
  const total = perPerson * jumlahJiwa;
  return { perPerson, total, kg: FITRAH_KG };
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

export interface ZakatHistory {
  id: string;
  date: string;
  type: "Penghasilan" | "Maal" | "Fitrah" | "Perniagaan" | "Pertanian" | "Peternakan" | "Rikaz" | "Madin";
  amount: number;
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

export function addHistory(entry: Omit<ZakatHistory, "id" | "date">) {
  const history = getHistory();
  history.unshift({
    ...entry,
    id: crypto.randomUUID(),
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
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
