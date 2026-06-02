import { describe, it, expect } from "vitest";
import { formatNumberInput, parseFormattedNumber } from "./format";
import {
  calcZakatPerniagaan,
  calcZakatPertanian,
  calcZakatPeternakan,
  calcZakatRikaz,
  calcZakatMadin,
} from "./zakat";

const GOLD = 1_500_000;

/**
 * Lapisan input UI memakai formatNumberInput + parseFormattedNumber.
 * Keduanya MEMBUANG semua karakter non-digit, sehingga:
 *  - tanda minus → diabaikan (tidak ada nilai negatif yang bisa masuk)
 *  - spasi / huruf / simbol → diabaikan
 *  - string kosong / hanya simbol → 0
 * Tombol "Hitung" pada tiap kategori disabled saat input wajib bernilai 0,
 * dan fungsi kalkulasi tetap aman bila dipanggil dengan 0.
 */

describe("formatNumberInput — menolak karakter non-digit", () => {
  it("string kosong → ''", () => {
    expect(formatNumberInput("")).toBe("");
  });
  it("hanya spasi → ''", () => {
    expect(formatNumberInput("   ")).toBe("");
  });
  it("hanya tanda minus → ''  (negatif ditolak di layer input)", () => {
    expect(formatNumberInput("-")).toBe("");
    expect(formatNumberInput("-100")).toBe("100");
  });
  it("huruf & simbol dibuang", () => {
    expect(formatNumberInput("abc123xyz")).toBe("123");
    expect(formatNumberInput("Rp 1.000.000")).toBe("1.000.000");
  });
  it("memformat ribuan id-ID", () => {
    expect(formatNumberInput("10000000")).toBe("10.000.000");
  });
  it("spasi di tengah & desimal koma dibuang (hanya digit)", () => {
    expect(formatNumberInput("12 345")).toBe("12.345");
    expect(formatNumberInput("1,5")).toBe("15");
  });
});

describe("parseFormattedNumber — selalu numerik non-negatif", () => {
  it("string kosong → 0", () => {
    expect(parseFormattedNumber("")).toBe(0);
  });
  it("hanya spasi/simbol → 0", () => {
    expect(parseFormattedNumber("   ")).toBe(0);
    expect(parseFormattedNumber("Rp.-")).toBe(0);
  });
  it("tanda minus dibuang (tidak pernah negatif)", () => {
    expect(parseFormattedNumber("-1.000")).toBe(1000);
    expect(parseFormattedNumber("-")).toBe(0);
  });
  it("string berformat id-ID → number", () => {
    expect(parseFormattedNumber("10.000.000")).toBe(10_000_000);
  });
});

describe("Perniagaan — guard nilai 0/negatif", () => {
  it("semua input 0 → tidak wajib, zakat 0", () => {
    const r = calcZakatPerniagaan(0, 0, 0, 0, GOLD);
    expect(r.totalAset).toBe(0);
    expect(r.hartaBersih).toBe(0);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
  it("hutang > aset → hartaBersih di-clamp ke 0, tidak negatif", () => {
    const r = calcZakatPerniagaan(1_000_000, 0, 0, 999_999_999, GOLD);
    expect(r.hartaBersih).toBe(0);
    expect(r.zakatAmount).toBe(0);
  });
  it("input negatif (skenario teoretis) tidak menghasilkan zakat negatif", () => {
    const r = calcZakatPerniagaan(-100, -50, -10, 0, GOLD);
    expect(r.zakatAmount).toBeGreaterThanOrEqual(0);
    expect(r.isWajib).toBe(false);
  });
});

describe("Pertanian — guard nilai 0/negatif", () => {
  it("hasil panen 0 → tidak wajib", () => {
    const r = calcZakatPertanian(0, 10_000, "tadah_hujan");
    expect(r.isWajib).toBe(false);
    expect(r.zakatKg).toBe(0);
    expect(r.zakatAmount).toBe(0);
  });
  it("harga 0 → zakatAmount 0 walau zakatKg ada", () => {
    const r = calcZakatPertanian(1000, 0, "tadah_hujan");
    expect(r.isWajib).toBe(true);
    expect(r.zakatKg).toBe(100);
    expect(r.zakatAmount).toBe(0);
  });
  it("hasil negatif → tidak wajib, zakat 0", () => {
    const r = calcZakatPertanian(-500, 10_000, "irigasi");
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
});

describe("Peternakan — guard nilai 0/negatif & di bawah nisab", () => {
  it("jumlah 0 → tidak wajib", () => {
    const r = calcZakatPeternakan(0, "kambing", 2_000_000);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
    expect(r.zakatDescription).toMatch(/Belum mencapai nisab/i);
  });
  it("jumlah negatif → tidak wajib", () => {
    const r = calcZakatPeternakan(-10, "sapi", 15_000_000);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
  it("harga 0 → zakatAmount 0 meski jumlah ≥ nisab", () => {
    const r = calcZakatPeternakan(40, "kambing", 0);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBe(0);
  });
  it("unta 4 ekor (di bawah nisab 5) → tidak wajib", () => {
    const r = calcZakatPeternakan(4, "unta", 30_000_000);
    expect(r.isWajib).toBe(false);
  });
});

describe("Rikaz — guard nilai 0/negatif", () => {
  it("nilai 0 → tidak wajib", () => {
    const r = calcZakatRikaz(0);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
  it("nilai negatif tidak menghasilkan zakat positif", () => {
    const r = calcZakatRikaz(-100);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBeLessThanOrEqual(0);
  });
});

describe("Ma'din — guard nilai 0/negatif", () => {
  it("nilai 0 → tidak wajib", () => {
    const r = calcZakatMadin(0, GOLD);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
  it("nilai negatif → tidak wajib, zakat 0", () => {
    const r = calcZakatMadin(-1_000_000, GOLD);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
  it("harga emas 0 → nisab 0, semua nilai positif jadi wajib (edge)", () => {
    const r = calcZakatMadin(1_000_000, 0);
    expect(r.nisab).toBe(0);
    expect(r.isWajib).toBe(true);
  });
});

describe("Integrasi format → parse → calc (alur input UI)", () => {
  const flow = (raw: string) => parseFormattedNumber(formatNumberInput(raw));

  it("string ber-spasi/huruf → parse jadi angka bersih lalu calc aman", () => {
    expect(flow("Rp 100.000.000")).toBe(100_000_000);
    const r = calcZakatPerniagaan(flow("Rp 100.000.000"), 0, 0, 0, GOLD);
    expect(r.isWajib).toBe(false); // < nisab 127.500.000
  });

  it("input '-' dan kosong → 0 untuk semua kategori", () => {
    expect(flow("-")).toBe(0);
    expect(flow("")).toBe(0);
    expect(calcZakatRikaz(flow("-"))).toMatchObject({ isWajib: false, zakatAmount: 0 });
    expect(calcZakatMadin(flow(""), GOLD)).toMatchObject({ isWajib: false, zakatAmount: 0 });
    expect(calcZakatPertanian(flow("-"), flow("-"), "tadah_hujan")).toMatchObject({ isWajib: false });
    expect(calcZakatPeternakan(flow("abc"), "kambing", flow(""))).toMatchObject({ isWajib: false });
  });
});
