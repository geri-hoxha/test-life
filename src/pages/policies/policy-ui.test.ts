import { describe, expect, it } from "vitest";
import { policyRenewalFlow } from "@/data/policy-plan-types";
import { buildPayerHistory, isBilledInLegacy, isPolicyCancellable, totalChargePremium } from "./policy-ui";

describe("totalChargePremium", () => {
  it("leaves out cancelled periods", () => {
    const periods = [
      { status: "expired", chargePremium: 2000 },
      { status: "active", chargePremium: 2194 },
      { status: "cancelled", chargePremium: 1594 },
    ];
    expect(totalChargePremium(periods)).toBe(4194);
  });

  it("counts every period that is still in force or already over", () => {
    const periods = [
      { status: "expired", chargePremium: 100 },
      { status: "active", chargePremium: 200 },
      { status: "scheduled", chargePremium: 300 },
    ];
    expect(totalChargePremium(periods)).toBe(600);
  });

  it("is zero without periods or amounts", () => {
    expect(totalChargePremium([])).toBe(0);
    expect(totalChargePremium([{ status: "active" }])).toBe(0);
  });
});

describe("isBilledInLegacy", () => {
  const periods = [
    { sequenceNumber: 1, legacyPolicyNumber: "L-100" },
    { sequenceNumber: 2, legacyPolicyNumber: "  " },
    { sequenceNumber: 3, legacyPolicyNumber: null },
  ];
  const installment = (coveragePeriodSequence: number | null, status = "readyToInvoice") => ({
    status,
    coveragePeriodSequence,
  });

  it("marks a ready-to-invoice installment of a legacy period", () => {
    expect(isBilledInLegacy(installment(1), periods)).toBe(true);
  });

  it("leaves installments of periods created here alone", () => {
    expect(isBilledInLegacy(installment(2), periods)).toBe(false);
    expect(isBilledInLegacy(installment(3), periods)).toBe(false);
    expect(isBilledInLegacy(installment(9), periods)).toBe(false);
    expect(isBilledInLegacy(installment(null), periods)).toBe(false);
  });

  it("accepts a legacy policy number the API sent as a number", () => {
    expect(isBilledInLegacy(installment(1), [{ sequenceNumber: 1, legacyPolicyNumber: 12345 }])).toBe(true);
  });

  it("only reinterprets ready-to-invoice installments", () => {
    expect(isBilledInLegacy(installment(1, "invoiced"), periods)).toBe(false);
    expect(isBilledInLegacy(installment(1, "planned"), periods)).toBe(false);
    expect(isBilledInLegacy(installment(1, "cancelled"), periods)).toBe(false);
  });
});

describe("isPolicyCancellable", () => {
  it("allows cancelling a policy that is still in force", () => {
    expect(isPolicyCancellable("active")).toBe(true);
    expect(isPolicyCancellable("pendingActivation")).toBe(true);
  });

  it("does not allow cancelling a policy that is already over", () => {
    expect(isPolicyCancellable("lapsed")).toBe(false);
    expect(isPolicyCancellable("cancelled")).toBe(false);
    expect(isPolicyCancellable("matured")).toBe(false);
  });
});

describe("policyRenewalFlow", () => {
  it("renews Protect policies by appending a period", () => {
    expect(policyRenewalFlow("PROTECT-55")).toBe("appendPeriod");
  });

  it("keeps upfront and single-premium plans free of renewals", () => {
    expect(policyRenewalFlow("PGP")).toBe("issuedAtInception");
    expect(policyRenewalFlow("PPRS")).toBe("issuedAtInception");
  });
});

describe("buildPayerHistory", () => {
  const ann = { partyId: "ann", displayName: "Ann" };
  const bob = { partyId: "bob", displayName: "Bob" };
  const cy = { partyId: "cy", displayName: "Cy" };
  const issued = { issuedOnUtc: "2024-03-01T09:00:00Z", participants: [{ role: "invoiced" as const, ...ann }] };

  it("is empty when the payer never changed", () => {
    expect(buildPayerHistory({ ...issued, invoiceRecipients: [], currentInvoiceRecipient: ann })).toEqual([]);
    expect(buildPayerHistory(undefined)).toEqual([]);
  });

  it("lists the payer at issue after the recorded changes, newest first", () => {
    const rows = buildPayerHistory({
      ...issued,
      invoiceRecipients: [
        { id: 2, effectiveFrom: "2026-01-01", ...cy },
        { id: 1, effectiveFrom: "2025-01-01", ...bob },
      ],
      currentInvoiceRecipient: cy,
    });
    expect(rows.map((r) => [r.payer.partyId, r.effectiveFrom, r.isCurrent, r.isIssuePayer])).toEqual([
      ["cy", "2026-01-01", true, false],
      ["bob", "2025-01-01", false, false],
      ["ann", "2024-03-01", false, true],
    ]);
  });

  it("does not repeat the payer at issue when the history starts with them", () => {
    const rows = buildPayerHistory({
      ...issued,
      invoiceRecipients: [
        { id: 1, effectiveFrom: "2024-03-01", ...ann },
        { id: 2, effectiveFrom: "2025-01-01", ...bob },
      ],
      currentInvoiceRecipient: bob,
    });
    expect(rows.map((r) => r.payer.partyId)).toEqual(["bob", "ann"]);
    expect(rows.some((r) => r.isIssuePayer)).toBe(false);
  });

  it("marks the latest stint of a payer who came back as current", () => {
    const rows = buildPayerHistory({
      ...issued,
      invoiceRecipients: [
        { id: 1, effectiveFrom: "2025-01-01", ...bob },
        { id: 2, effectiveFrom: "2026-01-01", ...ann },
      ],
      currentInvoiceRecipient: ann,
    });
    expect(rows.filter((r) => r.isCurrent).map((r) => r.effectiveFrom)).toEqual(["2026-01-01"]);
  });
});
