import { describe, expect, it } from "vitest";
import { formatAmount, formatMoney } from "./money-format";

describe("formatMoney", () => {
  it("keeps the trailing zero", () => {
    expect(formatMoney(1728.5, "ALL")).toMatch(/^ALL\s1,728\.50$/);
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
  });

  it("always shows two decimals", () => {
    expect(formatMoney(2198, "EUR")).toBe("€2,198.00");
    expect(formatMoney(0, "EUR")).toBe("€0.00");
    expect(formatMoney(2198, "ALL")).toMatch(/^ALL\s2,198\.00$/);
  });

  it("rounds to two decimals", () => {
    expect(formatMoney(10.005, "EUR")).toBe("€10.01");
    expect(formatMoney(10.004, "EUR")).toBe("€10.00");
  });

  it("falls back to ALL when no currency is given", () => {
    expect(formatMoney(5)).toMatch(/^ALL\s5\.00$/);
    expect(formatMoney(5, "  ")).toMatch(/^ALL\s5\.00$/);
  });

  it("does not throw on an unknown currency code", () => {
    expect(formatMoney(1728.5, "??")).toBe("1,728.50 ??");
  });

  it("shows a dash for a missing amount", () => {
    expect(formatMoney(null, "EUR")).toBe("—");
    expect(formatMoney(undefined, "EUR")).toBe("—");
    expect(formatMoney(Number.NaN, "EUR")).toBe("—");
  });
});

describe("formatAmount", () => {
  it("formats a bare amount with two decimals", () => {
    expect(formatAmount(1728.5)).toBe("1,728.50");
    expect(formatAmount(5000)).toBe("5,000.00");
  });
});
