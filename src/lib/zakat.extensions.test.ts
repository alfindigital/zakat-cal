import { describe, it, expect } from "vitest";
import {
  calcZakatPenghasilan,
  calcZakatFitrahUang,
  calcFidyah,
  roundZakat,
  uid,
} from "./zakat";
import { formatQuantityInput, parseQuantity } from "./format";

const GOLD = 2_000_000; // nisab 85g = 170.000.000

describe("Penghasilan — metode netto (potong kebutuhan pokok)", () => {
  it("tanpa potongan = perilaku lama (bruto)", () => {
    const r = calcZakatPenghasilan(20_000_000, 0, GOLD);
    expect(r.grossAnnual).toBe(240_000_000);
    expect(r.annualIncome).toBe(240_000_000);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(240_000_000 * 0.025, 6);
    expect(r.zakatMonthly).toBeCloseTo(r.zakatAmount / 12, 6);
  });

  it("potongan kebutuhan pokok mengurangi dasar zakat", () => {
    const r = calcZakatPenghasilan(20_000_000, 0, GOLD, "gold", 5_000_000);
    expect(r.annualIncome).toBe(240_000_000 - 60_000_000);
    expect(r.zakatAmount).toBeCloseTo(180_000_000 * 0.025, 6);
  });

  it("potongan tidak membuat dasar zakat negatif", () => {
    const r = calcZakatPenghasilan(1_000_000, 0, GOLD, "gold", 5_000_000);
    expect(r.annualIncome).toBe(0);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
});

describe("Fitrah uang & Fidyah", () => {
  it("fitrah uang = jiwa × tarif per jiwa", () => {
    const r = calcZakatFitrahUang(4, 50_000);
    expect(r.perPerson).toBe(50_000);
    expect(r.total).toBe(200_000);
  });
  it("fidyah = hari × nilai per hari", () => {
    const r = calcFidyah(10, 25_000);
    expect(r.total).toBe(250_000);
    expect(r.kgPerDay).toBeGreaterThan(0);
  });
  it("nilai negatif diabaikan", () => {
    expect(calcFidyah(-3, 25_000).total).toBe(0);
    expect(calcZakatFitrahUang(2, -1).total).toBe(0);
  });
});

describe("roundZakat — pembulatan ihtiyat ke atas (Rp 1.000)", () => {
  it("non-aktif → nilai apa adanya", () => {
    expect(roundZakat(1_234_567, false)).toBe(1_234_567);
  });
  it("aktif → dibulatkan ke atas ke kelipatan 1.000", () => {
    expect(roundZakat(1_234_001, true)).toBe(1_235_000);
    expect(roundZakat(1_234_000, true)).toBe(1_234_000);
  });
  it("nilai <= 0 tidak diubah", () => {
    expect(roundZakat(0, true)).toBe(0);
    expect(roundZakat(-5, true)).toBe(-5);
  });
});

describe("uid() — selalu menghasilkan id non-kosong & unik", () => {
  it("menghasilkan string unik", () => {
    const a = uid();
    const b = uid();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });
});

describe("formatQuantityInput / parseQuantity — desimal untuk gram & kg", () => {
  it("mempertahankan satu pemisah desimal", () => {
    expect(formatQuantityInput("2,5")).toBe("2,5");
    expect(parseQuantity("2,5")).toBe(2.5);
  });
  it("menerima titik sebagai desimal saat mengetik", () => {
    expect(parseQuantity(formatQuantityInput("12.5"))).toBe(12.5);
  });
  it("memformat ribuan + desimal", () => {
    expect(formatQuantityInput("1234,5")).toBe("1.234,5");
    expect(parseQuantity("1.234,5")).toBe(1234.5);
  });
  it("membuang huruf/simbol & nilai non-positif", () => {
    expect(parseQuantity("abc")).toBe(0);
    expect(parseQuantity("")).toBe(0);
    expect(parseQuantity("-3")).toBe(3); // tanda minus dibuang, jadi positif
  });
  it("koma di awal → 0,x", () => {
    expect(formatQuantityInput(",5")).toBe("0,5");
    expect(parseQuantity(formatQuantityInput(",5"))).toBe(0.5);
  });
});
