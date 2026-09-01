/** Map Offers API ↔ UI `Offer` shape. Unsupported UI fields stay as placeholders. */

import type {
  OffersOfferResponse,
  DomainOffersOfferStatus,
  OffersOfferParticipantResponse,
  OffersOfferInsuredPersonResponse,
  OffersOfferYearResponse,
  OffersOfferLoanDisbursementResponse,
  DomainOffersOfferYearDocumentStatus,
} from "../types";
import type {
  Offer,
  OfferStatus,
  PaymentMode,
  OfferParticipant,
  OfferInsuredPerson,
  OfferYear,
  OfferLoanDisbursement,
  Beneficiary,
} from "@/data/offers";

const DEFAULT_PAYMENT: PaymentMode = "Pagesa me prim te rregullt";

const statusFromApi = (s?: DomainOffersOfferStatus): OfferStatus => {
  switch (s) {
    case "draft":
      return "Draft";
    case "quoted":
      return "Quoted";
    case "partiallyBound":
      return "Partially Bound";
    case "bound":
      return "Bound";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return "Draft";
  }
};

const shareToPercentage = (share?: number | null) =>
  Math.round((share ?? 0) * 10000) / 100;

const mapParticipant = (p: OffersOfferParticipantResponse): OfferParticipant => ({
  id: String(p.id ?? ""),
  partyId: p.partyId ?? "",
  role: p.role ?? "policyHolder",
  partyType: p.partyType,
  uniqueIdentifier: p.uniqueIdentifier,
  displayName: p.displayName,
  countryCode: p.countryCode,
  isLeader: p.isLeader,
  share: p.share,
});

const mapInsuredPerson = (p: OffersOfferInsuredPersonResponse): OfferInsuredPerson => ({
  id: String(p.id ?? ""),
  personId: p.personId ?? "",
  personalIdentifier: p.personalIdentifier,
  countryCode: p.countryCode,
  firstName: p.firstName,
  lastName: p.lastName,
  dateOfBirth: p.dateOfBirth?.slice(0, 10),
  gender: p.gender,
});

const mapOfferYear = (s: OffersOfferYearResponse): OfferYear => ({
  id: String(s.id ?? ""),
  year: s.year ?? 0,
  startDate: s.period?.startDate?.slice(0, 10) ?? "",
  endDate: s.period?.endDate?.slice(0, 10) ?? "",
  insuredAmount: s.insuredAmount ?? 0,
  premium: s.premium ?? 0,
  payPremium: s.payPremium ?? s.premium ?? 0,
  internalStatus: s.internalStatus,
  policyId: s.policyId ?? null,
  coverages:
    s.coverages?.map((c) => ({
      id: String(c.id ?? ""),
      coverageId: c.coverageId ?? "",
      sumInsured: c.sumInsured ?? 0,
      rateUsed: c.rateUsed,
      ratingTableMultiplierUsed: c.ratingTableMultiplierUsed,
      calculatedPremium: c.calculatedPremium ?? 0,
    })) ?? [],
  documents:
    s.documents?.map((d) => ({
      id: String(d.id ?? ""),
      documentId: d.documentId ?? null,
      documentTypeId: d.documentTypeId ?? "",
      status: (d.status ?? "required") as DomainOffersOfferYearDocumentStatus,
      refusalReason: d.refusalReason,
    })) ?? [],
  discountRequests:
    s.discountRequests?.map((r) => ({
      id: String(r.id ?? ""),
      requestedDiscountPercentage: r.requestedDiscountPercentage ?? 0,
      reason: r.reason ?? "",
      status: r.status ?? "requested",
    })) ?? [],
  reviewFlags:
    s.reviewFlags?.map((f) => ({
      id: String(f.id ?? ""),
      type: f.type ?? "",
      reason: f.reason ?? "",
      status: f.status ?? "pending",
      raisedOnUtc: f.raisedOnUtc,
      resolvedOnUtc: f.resolvedOnUtc ?? null,
    })) ?? [],
});

const mapLoanDisbursement = (l: OffersOfferLoanDisbursementResponse): OfferLoanDisbursement => ({
  id: String(l.id ?? ""),
  year: l.year ?? 0,
  startDate: l.period?.startDate?.slice(0, 10) ?? "",
  endDate: l.period?.endDate?.slice(0, 10) ?? "",
  remainingLoanAmount: l.remainingLoanAmount ?? 0,
});

export const mapApiOffer = (o: OffersOfferResponse): Offer => {
  const participants = (o.participants ?? []).map(mapParticipant);
  const insuredPersons = (o.insuredPersons ?? []).map(mapInsuredPerson);
  const offerYears = (o.offerYears ?? []).map(mapOfferYear);
  const loanDisbursements = (o.loanDisbursements ?? []).map(mapLoanDisbursement);

  const holder = participants.find((p) => p.role === "policyHolder");
  const payer = participants.find((p) => p.role === "invoiced") ?? holder;
  const insured = insuredPersons[0];

  const beneficiaries: Beneficiary[] = participants
    .filter((p) => p.role === "beneficiary")
    .map((p) => ({
      id: p.id,
      customerId: p.partyId,
      relationship: "N/A",
      percentage: shareToPercentage(p.share),
      displayName: p.displayName,
      partyType: p.partyType,
      uniqueIdentifier: p.uniqueIdentifier,
    }));

  const firstYear = offerYears[0];
  const premium =
    firstYear?.payPremium ??
    firstYear?.premium ??
    firstYear?.coverages.reduce((sum, c) => sum + c.calculatedPremium, 0) ??
    0;

  const created = o.createdOnUtc?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const start = firstYear?.startDate || created;
  const end = firstYear?.endDate || created;
  const startYear = Number(start.slice(0, 4)) || new Date().getFullYear();
  const endYear = Number(end.slice(0, 4)) || startYear;
  const loan = loanDisbursements[0];

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
    participants,
    insuredPersons,
    startDate: start,
    endDate: end,
    termYears: Math.max(1, endYear - startYear),
    paymentMode: DEFAULT_PAYMENT,
    loan: loan
      ? {
          amount: loan.remainingLoanAmount,
          interestRate: 0,
          loanTermYears: Math.max(1, endYear - startYear),
          remainingYears: Math.max(1, endYear - startYear),
          outstandingBalance: loan.remainingLoanAmount,
        }
      : undefined,
    loanDisbursements,
    offerYears,
    premium,
    status: statusFromApi(o.status),
    createdDate: created,
  };
};
