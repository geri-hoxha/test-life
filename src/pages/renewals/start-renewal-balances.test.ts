import { describe, expect, it } from "vitest";
import { startRenewalRequestBody } from "./start-renewal-balances";

describe("startRenewalRequestBody", () => {
  it("sends an empty object when both balances are blank", () => {
    expect(startRenewalRequestBody("", "   ")).toEqual({ ok: true, body: {} });
  });

  it("requires the closing balance when only the opening balance is entered", () => {
    expect(startRenewalRequestBody("1200", "")).toEqual({
      ok: false,
      field: "closingBalance",
      message: "Enter a closing balance as well.",
    });
  });

  it("requires the opening balance when only the closing balance is entered", () => {
    expect(startRenewalRequestBody("", "800")).toEqual({
      ok: false,
      field: "openingBalance",
      message: "Enter an opening balance as well.",
    });
  });

  it("sends both balances when both are entered", () => {
    expect(startRenewalRequestBody("1200.5", "0")).toEqual({
      ok: true,
      body: { openingBalance: 1200.5, closingBalance: 0 },
    });
  });

  it("rejects a non-numeric balance", () => {
    expect(startRenewalRequestBody("abc", "10").ok).toBe(false);
  });
});
