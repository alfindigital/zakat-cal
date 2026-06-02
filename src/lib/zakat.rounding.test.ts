import { describe, it, expect } from "vitest";
import {
  calcZakatPenghasilan,
  calcZakatMaal,
  calcZakatPerniagaan,
  calcZakatPertanian,
  calcZakatPeternakan,
  calcZakatRikaz,
  calcZakatMadin,
  calcZakatFitrah,
  getNisab,
  DEFAULT_SILVER_PRICE,
} from "./zakat";

const GOLD = 1_000_000; // nisab 85g = 85.000.000
const NISAB = 85 * GOLD;

describe("Pembulatan & presisi — kasus batas nisab", () => {
  it("Penghasilan: 1 rupiah di bawah nisab → tidak wajib", () => {
    const r = calcZakatPenghasilan((NISAB - 1) / 12, 0, GOLD);
    // annualIncome bisa berisi pecahan; pastikan < nisab
    expect(r.annualIncome).toBeLessThan(NISAB);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });

  it("Penghasilan: tepat di nisab → wajib dan zakat = 2.5% (presisi 6 desimal)", () => {
    const r = calcZakatPenghasilan(NISAB / 12, 0, GOLD);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(NISAB * 0.025, 6);
  });

  it("Maal: harta = nisab + 0.0001 → tetap wajib (batas desimal)", () => {
    const r = calcZakatMaal(NISAB + 0.0001, 0, 0, 0, 0, 0, GOLD);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo((NISAB + 0.0001) * 0.025, 6);
  });

  it("Perniagaan: hutang menyebabkan tepat di nisab", () => {
    const r = calcZakatPerniagaan(NISAB + 1_000_000, 0, 0, 1_000_000, GOLD);
    expect(r.hartaBersih).toBe(NISAB);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(NISAB * 0.025, 6);
  });

  it("Madin: 1 rupiah di bawah nisab → tidak wajib", () => {
    const r = calcZakatMadin(NISAB - 1, GOLD);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
});

describe("Pembagian gram emas — presisi pecahan", () => {
  it("getNisab konsisten untuk harga pecahan", () => {
    const price = 1_234_567.89;
    expect(getNisab(price, "gold")).toBeCloseTo(85 * price, 6);
    expect(getNisab(price, "silver")).toBeCloseTo(595 * price, 6);
  });

  it("Maal: gram emas pecahan (12.345g) menghasilkan emasValue yang konsisten", () => {
    const r = calcZakatMaal(0, 12.345, 0, 0, 0, 0, GOLD);
    expect(r.emasValue).toBeCloseTo(12.345 * GOLD, 6);
    expect(r.totalHarta).toBeCloseTo(12.345 * GOLD, 6);
  });

  it("Maal: emas+perak akumulasi presisi (0.1 + 0.2 problem)", () => {
    const r = calcZakatMaal(0, 0.1, 0.2, 0, 0, 0, GOLD, DEFAULT_SILVER_PRICE);
    expect(r.emasValue).toBeCloseTo(0.1 * GOLD, 6);
    expect(r.perakValue).toBeCloseTo(0.2 * DEFAULT_SILVER_PRICE, 6);
    expect(r.totalHarta).toBeCloseTo(0.1 * GOLD + 0.2 * DEFAULT_SILVER_PRICE, 6);
  });
});

describe("Persentase rate — konsistensi 2.5%, 5%, 10%, 20%", () => {
  it("2.5% identik antara Maal, Penghasilan, Perniagaan, Madin untuk nilai sama", () => {
    const v = 200_000_000;
    const a = calcZakatMaal(v, 0, 0, 0, 0, 0, GOLD).zakatAmount;
    const b = calcZakatPenghasilan(v / 12, 0, GOLD).zakatAmount;
    const c = calcZakatPerniagaan(v, 0, 0, 0, GOLD).zakatAmount;
    const d = calcZakatMadin(v, GOLD).zakatAmount;
    expect(a).toBeCloseTo(b, 6);
    expect(b).toBeCloseTo(c, 6);
    expect(c).toBeCloseTo(d, 6);
    expect(a).toBeCloseTo(v * 0.025, 6);
  });

  it("Pertanian 5% vs 10% menghasilkan rasio tepat 2x", () => {
    const a = calcZakatPertanian(1000, 10_000, "irigasi");
    const b = calcZakatPertanian(1000, 10_000, "tadah_hujan");
    expect(b.zakatAmount).toBeCloseTo(a.zakatAmount * 2, 6);
    expect(b.zakatKg).toBeCloseTo(a.zakatKg * 2, 6);
  });

  it("Rikaz 20% pada nilai pecahan", () => {
    const r = calcZakatRikaz(12_345_678.9);
    expect(r.zakatAmount).toBeCloseTo(12_345_678.9 * 0.2, 6);
  });

  it("Pertanian: hasil panen pecahan menghasilkan zakatKg konsisten", () => {
    const r = calcZakatPertanian(653.333, 10_000, "irigasi");
    expect(r.zakatKg).toBeCloseTo(653.333 * 0.05, 6);
    expect(r.zakatAmount).toBeCloseTo(653.333 * 0.05 * 10_000, 6);
  });
});

describe("Peternakan — pembulatan jumlah ekor (integer tier)", () => {
  it("kambing tepat di batas tier (120 vs 121)", () => {
    const a = calcZakatPeternakan(120, "kambing", 2_000_000);
    const b = calcZakatPeternakan(121, "kambing", 2_000_000);
    expect(a.tierCount).toBe(1);
    expect(b.tierCount).toBe(2);
    expect(b.zakatAmount).toBe(a.zakatAmount * 2);
  });

  it("unta tepat di batas tier (24 ekor=4 kambing, 25 ekor=1 bintu makhad)", () => {
    const a = calcZakatPeternakan(24, "unta", 5_000_000);
    const b = calcZakatPeternakan(25, "unta", 5_000_000);
    expect(a.tierCount).toBe(4);
    expect(b.tierCount).toBe(1);
  });

  it("harga per ekor pecahan tetap presisi", () => {
    const r = calcZakatPeternakan(40, "kambing", 1_999_999.99);
    expect(r.zakatAmount).toBeCloseTo(1 * 1_999_999.99, 6);
  });
});

describe("Fitrah — pembagian 2.5 kg × harga beras", () => {
  it("per orang = 2.5 × harga beras (presisi)", () => {
    const r = calcZakatFitrah(1, 0);
    expect(r.kg).toBe(2.5);
    expect(r.perPerson).toBeCloseTo(2.5 * 14_000, 6);
    expect(r.total).toBeCloseTo(2.5 * 14_000, 6);
  });

  it("total = perPerson × jumlahJiwa untuk jumlah besar", () => {
    const r = calcZakatFitrah(1000, 1);
    expect(r.total).toBeCloseTo(2.5 * 18_000 * 1000, 6);
  });
});
