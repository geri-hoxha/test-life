/** Map Offers API ↔ UI `Offer` shape. Unsupported UI fields stay as placeholders. */

import type { OffersOfferResponse, DomainOffersOfferStatus } from "../types";
import type { Offer, OfferStatus, PaymentMode } from "@/data/offers";

const DEFAULT_PAYMENT: PaymentMode = "Pagesa me prim te rregullt";

const statusFromApi = (s?: DomainOffersOfferStatus): OfferStatus => {
  switch (s) {
    case "draft":
      return "Draft";
    case "quoted":
      return "Quoted";
    case "partiallyBound":
      return "Pending Review";
    case "bound":
      return "Issued";
    case "cancelled":
      return "Rejected";
    case "expired":
      return "Rejected";
    default:
      return "Draft";
  }
};

export const mapApiOffer = (o: OffersOfferResponse): Offer => {
  const holder = o.participants?.find((p) => p.role === "policyHolder");
  const payer = o.participants?.find((p) => p.role === "invoiced") ?? holder;
  const insured = o.insuredPersons?.[0];
  const beneficiaries =
    o.participants
      ?.filter((p) => p.role === "beneficiary")
      .map((p, i) => ({
        id: String(p.id ?? i),
        customerId: p.partyId ?? "",
        relationship: "N/A",
        percentage: p.share ?? 0,
      })) ?? [];

  const schedule = o.schedules?.[0];
  const premium =
    schedule?.premium ??
    schedule?.coverages?.reduce((sum, c) => sum + (c.calculatedPremium ?? 0), 0) ??
    0;

  const created = o.createdOnUtc?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const start = schedule?.period?.startDate?.slice(0, 10) ?? created;
  const end = schedule?.period?.endDate?.slice(0, 10) ?? created;
  const startYear = Number(start.slice(0, 4)) || new Date().getFullYear();
  const endYear = Number(end.slice(0, 4)) || startYear;
  const loan = o.loanDisbursements?.[0];

  return {
    id: o.id ?? "",
    number: o.id ?? "",
    productId: o.productId ?? "",
    versionId: "N/A",
    templateId: "N/A",
    currency: o.currency ?? "EUR",
    policyHolderId: holder?.partyId ?? "",
    payerId: payer?.partyId ?? "",
    insuredId: insured?.personId ?? "",
    beneficiaries,
    startDate: start,
    endDate: end,
    termYears: Math.max(1, endYear - startYear),
    paymentMode: DEFAULT_PAYMENT,
    loan: loan
      ? {
          amount: loan.remainingLoanAmount ?? 0,
          interestRate: 0,
          loanTermYears: 0,
          remainingYears: 0,
          outstandingBalance: loan.remainingLoanAmount ?? 0,
        }
      : undefined,
    premium,
    status: statusFromApi(o.status),
    createdDate: created,
  };
};
