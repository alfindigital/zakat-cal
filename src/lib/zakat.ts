// Default gold price per gram in IDR (fallback)
const DEFAULT_GOLD_PRICE = 1_200_000;
const NISAB_GOLD_GRAMS = 85;
const SILVER_PRICE_PER_GRAM = 15_000;
const ZAKAT_RATE = 0.025;
const FITRAH_KG = 2.5;

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

export function getNisab(goldPrice: number) {
  return NISAB_GOLD_GRAMS * goldPrice;
}

export function calcZakatPenghasilan(monthlyIncome: number, annualBonus: number, goldPrice: number) {
  const annualIncome = monthlyIncome * 12 + annualBonus;
  const nisab = getNisab(goldPrice);
  const isWajib = annualIncome >= nisab;
  const zakatAmount = isWajib ? annualIncome * ZAKAT_RATE : 0;
  return { annualIncome, nisab, isWajib, zakatAmount };
}

export function calcZakatMaal(
  tabungan: number,
  emasGram: number,
  perakGram: number,
  investasi: number,
  properti: number,
  hutang: number,
  goldPrice: number
) {
  const emasValue = emasGram * goldPrice;
  const perakValue = perakGram * SILVER_PRICE_PER_GRAM;
  const totalHarta = tabungan + emasValue + perakValue + investasi + properti;
  const hartaBersih = Math.max(0, totalHarta - hutang);
  const nisab = getNisab(goldPrice);
  const isWajib = hartaBersih >= nisab;
  const zakatAmount = isWajib ? hartaBersih * ZAKAT_RATE : 0;
  return { totalHarta, hartaBersih, emasValue, perakValue, nisab, isWajib, zakatAmount };
}

export function calcZakatFitrah(jumlahJiwa: number, riceIndex: number) {
  const pricePerKg = RICE_OPTIONS[riceIndex]?.pricePerKg ?? RICE_OPTIONS[0].pricePerKg;
  const perPerson = FITRAH_KG * pricePerKg;
  const total = perPerson * jumlahJiwa;
  return { perPerson, total, kg: FITRAH_KG };
}

export interface ZakatHistory {
  id: string;
  date: string;
  type: "Penghasilan" | "Maal" | "Fitrah";
  amount: number;
}

const STORAGE_KEY = "zakat-history";

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
}

export function removeHistory(id: string) {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
