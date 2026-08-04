/** Map Policies API ↔ UI `Policy` shape. Unsupported UI fields stay as placeholders. */

import type { PoliciesPolicyResponse } from "../types";
import type { Policy, PolicyStatus } from "@/data/policies";
import type { PaymentMode } from "@/data/offers";

const DEFAULT_PAYMENT: PaymentMode = "Pagesa me prim te rregullt";

export const mapApiPolicy = (p: PoliciesPolicyResponse): Policy => {
  const holder = p.participants?.find((x) => x.role === "policyHolder");
  const payer = p.participants?.find((x) => x.role === "invoiced") ?? holder;
  const insured = p.insuredPersons?.[0];
  const beneficiaries =
    p.participants
      ?.filter((x) => x.role === "beneficiary")
      .map((x, i) => ({
        id: String(x.id ?? i),
        customerId: x.partyId ?? "",
        relationship: "N/A",
        percentage: x.share ?? 0,
      })) ?? [];

  const premium =
    p.coverages?.reduce((sum, c) => sum + (c.calculatedPremium ?? 0), 0) ?? 0;

  const start = p.effectiveFromUtc?.slice(0, 10) ?? p.issuedOnUtc?.slice(0, 10) ?? "";
  const end = p.effectiveToUtc?.slice(0, 10) ?? start;
  const startYear = Number(start.slice(0, 4)) || new Date().getFullYear();
  const endYear = Number(end.slice(0, 4)) || startYear;

  // API has no status yet — treat issued policies as Active.
  const status: PolicyStatus = "Active";

  return {
    id: p.id ?? "",
    number: p.id ?? "",
    offerId: p.offerId ?? "",
    productId: p.productId ?? "",
    versionId: "N/A",
    templateId: "N/A",
    currency: p.currency ?? "EUR",
    policyHolderId: holder?.partyId ?? "",
    payerId: payer?.partyId ?? "",
    insuredId: insured?.personId ?? "",
    beneficiaries,
    startDate: start,
    endDate: end,
    termYears: Math.max(1, endYear - startYear),
    paymentMode: DEFAULT_PAYMENT,
    premium,
    status,
    issueDate: p.issuedOnUtc?.slice(0, 10) ?? start,
    issuedBy: "N/A",
  };
};
