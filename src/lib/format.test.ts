import { describe, it, expect } from "vitest";
import { formatMetalPrice, formatQuantityInput, parseQuantity, formatNumberInput } from "./format";

describe("formatMetalPrice", () => {
  it("always renders exactly 2 decimals", () => {
    expect(formatMetalPrice(1000)).toBe("1.000,00");
    expect(formatMetalPrice(1000.5)).toBe("1.000,50");
    expect(formatMetalPrice(1234567.891)).toBe("1.234.567,89");
    expect(formatMetalPrice(0)).toBe("0,00");
  });

  it("uses Indonesian locale thousand separators", () => {
    expect(formatMetalPrice(2000000)).toBe("2.000.000,00");
    expect(formatMetalPrice(28000.4)).toBe("28.000,40");
  });

  it("handles invalid input safely", () => {
    expect(formatMetalPrice(NaN)).toBe("0,00");
    expect(formatMetalPrice(Infinity)).toBe("0,00");
    expect(formatMetalPrice(-Infinity)).toBe("0,00");
    expect(formatMetalPrice(null)).toBe("0,00");
    expect(formatMetalPrice(undefined)).toBe("0,00");
    expect(formatMetalPrice("abc")).toBe("0,00");
    expect(formatMetalPrice("")).toBe("0,00");
  });

  it("clamps negative values to zero", () => {
    expect(formatMetalPrice(-500)).toBe("0,00");
    expect(formatMetalPrice(-0.01)).toBe("0,00");
  });

  it("handles zero and near-zero values", () => {
    expect(formatMetalPrice(0)).toBe("0,00");
    expect(formatMetalPrice(0.001)).toBe("0,00");
    expect(formatMetalPrice(0.005)).toMatch(/^0,0[01]$/); // rounding at 2dp
    expect(formatMetalPrice(0.5)).toBe("0,50");
  });

  it("rounds long decimals to 2 places (banker/half-even tolerant)", () => {
    expect(formatMetalPrice(1234.567)).toBe("1.234,57");
    expect(formatMetalPrice(1234.564)).toBe("1.234,56");
    expect(formatMetalPrice(999999.999)).toBe("1.000.000,00");
    expect(formatMetalPrice(0.123456789)).toBe("0,12");
  });

  it("handles very large numbers", () => {
    expect(formatMetalPrice(1_000_000_000)).toBe("1.000.000.000,00");
    expect(formatMetalPrice(12345678901.23)).toBe("12.345.678.901,23");
  });

  it("accepts string inputs (plain and id-ID formatted)", () => {
    expect(formatMetalPrice("1234.5")).toBe("1.234,50");
    expect(formatMetalPrice("1000")).toBe("1.000,00");
    expect(formatMetalPrice("1.234.567,89")).toBe("1.234.567,89");
    expect(formatMetalPrice("28.000,4")).toBe("28.000,40");
    expect(formatMetalPrice("  2000000  ")).toBe("2.000.000,00");
  });
});

describe("formatQuantityInput", () => {
  it("groups thousands and keeps one comma", () => {
    expect(formatQuantityInput("1234567")).toBe("1.234.567");
    expect(formatQuantityInput("1234,5")).toBe("1.234,5");
  });

  it("caps decimals when maxDecimals given", () => {
    expect(formatQuantityInput("1234,567", 2)).toBe("1.234,56");
  });
});

describe("parseQuantity", () => {
  it("parses id-ID formatted numbers", () => {
    expect(parseQuantity("1.234,5")).toBe(1234.5);
    expect(parseQuantity("2.000.000")).toBe(2000000);
  });
});

describe("formatNumberInput", () => {
  it("formats integers with dots", () => {
    expect(formatNumberInput("10000000")).toBe("10.000.000");
    expect(formatNumberInput("")).toBe("");
  });
});
