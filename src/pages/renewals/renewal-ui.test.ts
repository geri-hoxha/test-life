import { describe, expect, it } from "vitest";
import { formatPolicyMoney } from "@/pages/policies/policy-ui";
import { canStartRenewal, formatRenewalMoney } from "./renewal-ui";

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

describe("canStartRenewal", () => {
  const year = (targetPeriodSequence: number, status: string) => ({ targetPeriodSequence, status });
  // The API returns a policy's renewals in no particular order.
  const policy = [
    year(6, "planned"),
    year(2, "applied"),
    year(3, "applied"),
    year(5, "applied"),
    year(4, "applied"),
    year(7, "planned"),
    year(8, "planned"),
  ];

  it("allows only the next planned year", () => {
    expect(canStartRenewal(year(6, "planned"), policy)).toBe(true);
    expect(canStartRenewal(year(7, "planned"), policy)).toBe(false);
    expect(canStartRenewal(year(8, "planned"), policy)).toBe(false);
  });

  it("does not offer a renewal that is not planned", () => {
    expect(canStartRenewal(year(4, "applied"), policy)).toBe(false);
    expect(canStartRenewal(year(6, "draft"), policy)).toBe(false);
  });

  it("waits while an earlier year is still in progress", () => {
    const inProgress = [year(2, "applied"), year(3, "priced"), year(4, "planned")];
    expect(canStartRenewal(year(4, "planned"), inProgress)).toBe(false);
  });

  it("treats cancelled earlier years as out of the way", () => {
    const withCancelled = [year(2, "cancelled"), year(3, "applied"), year(4, "planned")];
    expect(canStartRenewal(year(4, "planned"), withCancelled)).toBe(true);
  });

  it("does not guess when the sequence is unknown", () => {
    expect(canStartRenewal({ status: "planned" }, policy)).toBe(false);
  });
});
