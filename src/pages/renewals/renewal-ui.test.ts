import { describe, expect, it } from "vitest";
import { formatPolicyMoney } from "@/pages/policies/policy-ui";
import { formatRenewalMoney } from "./renewal-ui";

describe("formatRenewalMoney", () => {
  it("formats amounts in the renewal's currency", () => {
    expect(formatRenewalMoney(2198, "EUR")).toBe("€2,198.00");
    expect(formatRenewalMoney(0, "EUR")).toBe("€0.00");
    expect(formatRenewalMoney(5, "EUR")).toBe("€5.00");
    expect(formatRenewalMoney(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats ALL amounts the same way the policy page does", () => {
    expect(formatRenewalMoney(34135, "ALL")).toBe(formatPolicyMoney(34135, "ALL"));
  });

  it("shows a dash for an empty balance, whatever the currency", () => {
    expect(formatRenewalMoney(null, "EUR")).toBe("—");
    expect(formatRenewalMoney(undefined, "ALL")).toBe("—");
  });

  it("does not assume ALL when the currency is unknown", () => {
    expect(formatRenewalMoney(2198, undefined)).toBe("2,198");
    expect(formatRenewalMoney(2198, "  ")).not.toContain("ALL");
  });
});
