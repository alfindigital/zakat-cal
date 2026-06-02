import { describe, it, expect } from "vitest";
import {
  calcZakatPerniagaan,
  calcZakatPertanian,
  calcZakatPeternakan,
  calcZakatRikaz,
  calcZakatMadin,
} from "./zakat";

const GOLD = 1_500_000; // Rp/gram → nisab 85g = 127.500.000
const NISAB_GOLD = 85 * GOLD;

describe("calcZakatPerniagaan", () => {
  it("menghitung harta bersih = modal+piutang+stok - hutang dagang", () => {
    const r = calcZakatPerniagaan(100_000_000, 30_000_000, 20_000_000, 10_000_000, GOLD);
    expect(r.totalAset).toBe(150_000_000);
    expect(r.hartaBersih).toBe(140_000_000);
    expect(r.nisab).toBe(NISAB_GOLD);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(140_000_000 * 0.025, 2);
  });

  it("tidak wajib jika harta bersih < nisab", () => {
    const r = calcZakatPerniagaan(50_000_000, 0, 0, 0, GOLD);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });

  it("harta bersih tidak boleh negatif", () => {
    const r = calcZakatPerniagaan(10_000_000, 0, 0, 50_000_000, GOLD);
    expect(r.hartaBersih).toBe(0);
    expect(r.zakatAmount).toBe(0);
  });

  it("tepat di nisab tetap wajib", () => {
    const r = calcZakatPerniagaan(NISAB_GOLD, 0, 0, 0, GOLD);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(NISAB_GOLD * 0.025, 2);
  });
});

describe("calcZakatPertanian", () => {
  it("tadah hujan dikenai 10%", () => {
    const r = calcZakatPertanian(1000, 10_000, "tadah_hujan");
    expect(r.rate).toBe(0.1);
    expect(r.nisabKg).toBe(653);
    expect(r.isWajib).toBe(true);
    expect(r.zakatKg).toBe(100);
    expect(r.totalValue).toBe(10_000_000);
    expect(r.zakatAmount).toBe(1_000_000);
  });

  it("irigasi/biaya dikenai 5%", () => {
    const r = calcZakatPertanian(2000, 8_000, "irigasi");
    expect(r.rate).toBe(0.05);
    expect(r.zakatKg).toBe(100);
    expect(r.zakatAmount).toBe(800_000);
  });

  it("di bawah nisab 653 kg tidak wajib", () => {
    const r = calcZakatPertanian(500, 10_000, "tadah_hujan");
    expect(r.isWajib).toBe(false);
    expect(r.zakatKg).toBe(0);
    expect(r.zakatAmount).toBe(0);
  });

  it("tepat di nisab 653 kg sudah wajib", () => {
    const r = calcZakatPertanian(653, 10_000, "irigasi");
    expect(r.isWajib).toBe(true);
    expect(r.zakatKg).toBeCloseTo(32.65, 2);
  });
});

describe("calcZakatPeternakan", () => {
  it("kambing: nisab 40 ekor = 1 ekor", () => {
    const r = calcZakatPeternakan(40, "kambing", 2_000_000);
    expect(r.isWajib).toBe(true);
    expect(r.minNisab).toBe(40);
    expect(r.tierCount).toBe(1);
    expect(r.zakatAmount).toBe(2_000_000);
  });

  it("kambing: 121-200 ekor = 2 ekor", () => {
    const r = calcZakatPeternakan(150, "kambing", 2_000_000);
    expect(r.tierCount).toBe(2);
    expect(r.zakatAmount).toBe(4_000_000);
  });

  it("kambing: 39 ekor belum wajib", () => {
    const r = calcZakatPeternakan(39, "kambing", 2_000_000);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });

  it("sapi: 30 ekor = 1 tabi'", () => {
    const r = calcZakatPeternakan(30, "sapi", 15_000_000);
    expect(r.isWajib).toBe(true);
    expect(r.minNisab).toBe(30);
    expect(r.tierCount).toBe(1);
    expect(r.zakatAmount).toBe(15_000_000);
  });

  it("sapi: 60-69 = 2 ekor tabi'", () => {
    const r = calcZakatPeternakan(65, "sapi", 15_000_000);
    expect(r.tierCount).toBe(2);
  });

  it("sapi: 29 ekor belum wajib", () => {
    const r = calcZakatPeternakan(29, "sapi", 15_000_000);
    expect(r.isWajib).toBe(false);
  });

  it("unta: 5 ekor = 1 kambing", () => {
    const r = calcZakatPeternakan(5, "unta", 30_000_000);
    expect(r.isWajib).toBe(true);
    expect(r.minNisab).toBe(5);
    expect(r.tierCount).toBe(1);
  });

  it("unta: 25 ekor = 1 bintu makhad", () => {
    const r = calcZakatPeternakan(25, "unta", 30_000_000);
    expect(r.tierCount).toBe(1);
    expect(r.zakatDescription).toContain("bintu makhad");
  });

  it("unta: 4 ekor belum wajib", () => {
    const r = calcZakatPeternakan(4, "unta", 30_000_000);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
});

describe("calcZakatRikaz", () => {
  it("20% tanpa nisab/haul", () => {
    const r = calcZakatRikaz(100_000_000);
    expect(r.rate).toBe(0.2);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBe(20_000_000);
  });

  it("nilai sangat kecil tetap wajib 20%", () => {
    const r = calcZakatRikaz(1000);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBe(200);
  });

  it("nilai 0 tidak wajib", () => {
    const r = calcZakatRikaz(0);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });
});

describe("calcZakatMadin", () => {
  it("≥ nisab 85g emas → 2.5%", () => {
    const r = calcZakatMadin(200_000_000, GOLD);
    expect(r.nisab).toBe(NISAB_GOLD);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(200_000_000 * 0.025, 2);
  });

  it("< nisab tidak wajib", () => {
    const r = calcZakatMadin(50_000_000, GOLD);
    expect(r.isWajib).toBe(false);
    expect(r.zakatAmount).toBe(0);
  });

  it("tepat di nisab sudah wajib", () => {
    const r = calcZakatMadin(NISAB_GOLD, GOLD);
    expect(r.isWajib).toBe(true);
    expect(r.zakatAmount).toBeCloseTo(NISAB_GOLD * 0.025, 2);
  });
});
