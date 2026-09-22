/** Map Offers API ↔ UI `Offer` shape. Unsupported UI fields stay as placeholders. */

import type {
  DomainOffersOfferStatus,
  OffersOfferListItemResponse,
  OffersOfferPeriodResponse,
  OffersOfferResponse,
} from "../types";
import type {
  Offer,
  OfferDiscountRequest,
  OfferDocumentRequirement,
  OfferInsuredPerson,
  OfferListItem,
  OfferLoanDisbursement,
  OfferLoanSubmission,
  OfferParticipant,
  OfferReviewFlag,
  OfferStatus,
  OfferYear,
  PaymentMode,
  Beneficiary,
} from "@/data/offers";

const DEFAULT_PAYMENT: PaymentMode = "Pagesa me prim te rregullt";

export const statusFromApi = (s?: DomainOffersOfferStatus | string | null): OfferStatus => {
  switch (s) {
    case "draft":
      return "Draft";
    case "quoted":
      return "Quoted";
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

const mapParticipant = (p: NonNullable<OffersOfferResponse["participants"]>[number]): OfferParticipant => ({
  id: String(p.id ?? ""),
  partyId: p.partyId ?? "",
  role: p.role ?? "policyHolder",
  partyType: p.partyType,
  uniqueIdentifier: p.uniqueIdentifier,
  displayName: p.displayName,
  countryCode: p.countryCode,
  isLeader: p.isLeader,
  share: p.share,
  relationshipToInsured: p.relationshipToInsured,
});

const mapInsuredPerson = (p: NonNullable<OffersOfferResponse["insuredPersons"]>[number]): OfferInsuredPerson => ({
  id: String(p.id ?? ""),
  personId: p.personId ?? "",
  personalIdentifier: p.personalIdentifier,
  countryCode: p.countryCode,
  firstName: p.firstName,
  lastName: p.lastName,
  dateOfBirth: p.dateOfBirth?.slice(0, 10),
  gender: p.gender,
});

const periodInsuredAmount = (s: OffersOfferPeriodResponse) =>
  s.openingBalance ??
  Math.max(0, ...(s.coverages ?? []).map((c) => c.sumInsured ?? 0));

const mapOfferPeriod = (s: OffersOfferPeriodResponse, offerPolicyId?: string | null): OfferYear => ({
  id: String(s.id ?? ""),
  year: s.sequenceNumber ?? 0,
  startDate: s.period?.startDate?.slice(0, 10) ?? "",
  endDate: s.period?.endDate?.slice(0, 10) ?? "",
  insuredAmount: periodInsuredAmount(s),
  premium: s.calculatedPremium ?? 0,
  payPremium: s.chargePremium ?? s.calculatedPremium ?? 0,
  internalStatus: s.status,
  policyId: s.status === "appliedToPolicy" ? offerPolicyId ?? null : null,
  openingBalance: s.openingBalance ?? null,
  closingBalance: s.closingBalance ?? null,
  coverages:
    s.coverages?.map((c) => ({
      id: String(c.id ?? ""),
      coverageId: c.coverageId ?? "",
      sumInsured: c.sumInsured ?? 0,
      rateUsed: c.rateUsed,
      ratingTableMultiplierUsed: c.ratingTableMultiplierUsed,
      calculatedPremium: c.calculatedPremium ?? 0,
    })) ?? [],
});

const mapLoanFromPeriod = (s: OffersOfferPeriodResponse): OfferLoanDisbursement => ({
  id: String(s.id ?? ""),
  year: s.sequenceNumber ?? 0,
  startDate: s.period?.startDate?.slice(0, 10) ?? "",
  endDate: s.period?.endDate?.slice(0, 10) ?? "",
  remainingLoanAmount: s.openingBalance ?? 0,
  closingBalance: s.closingBalance ?? null,
});

const mapLoanSubmission = (
  l: NonNullable<OffersOfferResponse["loanSubmissions"]>[number],
): OfferLoanSubmission => ({
  id: String(l.id ?? ""),
  sourceSystem: l.sourceSystem ?? "",
  externalReference: l.externalReference,
  receivedOnUtc: l.receivedOnUtc,
});

const mapDocumentRequirement = (
  d: NonNullable<OffersOfferResponse["documentRequirements"]>[number],
): OfferDocumentRequirement => ({
  id: String(d.id ?? ""),
  documentId: d.documentId ?? null,
  documentTypeId: d.documentTypeId ?? "",
  status: d.status ?? "required",
  submissionSource: d.submissionSource,
  refusalReason: d.refusalReason,
  waiverReason: d.waiverReason,
  isSatisfied: d.isSatisfied,
  submittedOnUtc: d.submittedOnUtc ?? null,
  decidedOnUtc: d.decidedOnUtc ?? null,
});

const mapReviewFlag = (
  f: NonNullable<OffersOfferResponse["reviewFlags"]>[number],
): OfferReviewFlag => ({
  id: String(f.id ?? ""),
  type: f.type ?? "",
  reason: f.reason ?? "",
  status: f.status ?? "raised",
  raisedOnUtc: f.raisedOnUtc,
  resolvedOnUtc: f.resolvedOnUtc ?? null,
  resolutionNote: f.resolutionNote,
});

const mapDiscountRequest = (
  r: NonNullable<OffersOfferResponse["discountRequests"]>[number],
): OfferDiscountRequest => ({
  id: String(r.id ?? ""),
  requestedDiscountPercentage: r.requestedDiscountPercentage ?? 0,
  reason: r.reason ?? "",
  status: r.status ?? "requested",
  targetPeriodSequence: r.targetPeriodSequence ?? null,
  requestedOnUtc: r.requestedOnUtc,
  decidedOnUtc: r.decidedOnUtc ?? null,
});

export const mapApiOffer = (o: OffersOfferResponse): Offer => {
  const participants = (o.participants ?? []).map(mapParticipant);
  const insuredPersons = (o.insuredPersons ?? []).map(mapInsuredPerson);
  const offerYears = (o.periods ?? []).map((p) => mapOfferPeriod(p, o.policyId));
  const hasLoanBalances = (o.periods ?? []).some(
    (p) => p.openingBalance != null || p.closingBalance != null,
  );
  const loanDisbursements = hasLoanBalances
    ? (o.periods ?? []).map(mapLoanFromPeriod)
    : [];
  const loanSubmissions = (o.loanSubmissions ?? []).map(mapLoanSubmission);
  const documentRequirements = (o.documentRequirements ?? []).map(mapDocumentRequirement);
  const reviewFlags = (o.reviewFlags ?? []).map(mapReviewFlag);
  const discountRequests = (o.discountRequests ?? []).map(mapDiscountRequest);

  const holder = participants.find((p) => p.role === "policyHolder");
  const payer = participants.find((p) => p.role === "invoiced") ?? holder;
  const insured = insuredPersons[0];

  const beneficiaries: Beneficiary[] = participants
    .filter((p) => p.role === "beneficiary")
    .map((p) => ({
      id: p.id,
      customerId: p.partyId,
      relationship: p.relationshipToInsured ?? "N/A",
      percentage: shareToPercentage(p.share),
      displayName: p.displayName,
      partyType: p.partyType,
      uniqueIdentifier: p.uniqueIdentifier,
    }));

  const firstYear = offerYears[0];
  const premium = offerYears.reduce(
    (sum, s) => sum + (s.payPremium || s.premium || 0),
    0,
  );

  const created = o.createdOnUtc?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const start = o.coverageTerm?.startDate?.slice(0, 10) || firstYear?.startDate || created;
  const end = o.coverageTerm?.endDate?.slice(0, 10) || firstYear?.endDate || created;
  const startYear = Number(start.slice(0, 4)) || new Date().getFullYear();
  const endYear = Number(end.slice(0, 4)) || startYear;
  const loan = loanDisbursements[0];
  const sales = o.salesAttribution;

  return {
    id: o.id ?? "",
    number: o.id ?? "",
    productId: o.productId ?? "",
    versionId: "N/A",
    templateId: "N/A",
    currency: o.currency ?? "EUR",
    policyPlan: o.policyPlan,
    requiresLoanBalances: o.requiresLoanBalances,
    policyId: o.policyId ?? null,
    renewedFromPolicyId: o.renewedFromPolicyId ?? null,
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
          loanTermYears: Math.max(1, loanDisbursements.length),
          remainingYears: Math.max(1, loanDisbursements.length),
          outstandingBalance: loan.remainingLoanAmount,
        }
      : undefined,
    loanDisbursements,
    loanSubmissions,
    offerYears,
    documentRequirements,
    reviewFlags,
    discountRequests,
    premium,
    status: statusFromApi(o.status),
    createdDate: created,
    createdOnUtc: o.createdOnUtc ?? null,
    quotedOnUtc: o.quotedOnUtc ?? null,
    createdByAuthUserId: sales?.createdByAuthUserId ?? null,
    createdByUserName: sales?.createdByUserName ?? null,
    salesChannel: sales?.salesChannel,
    salesPartyName:
      sales?.partnerName ??
      sales?.agentDisplayName ??
      sales?.internalOfficeName ??
      sales?.createdByUserName ??
      null,
    agentId: sales?.agentId ?? null,
    agentSelectionMethod: sales?.agentSelectionMethod ?? null,
    salesAgentName: sales?.agentDisplayName ?? null,
    partnerId: sales?.partnerId ?? null,
    salesPartnerName: sales?.partnerName ?? null,
    partnerOfficeId: sales?.partnerOfficeId ?? null,
    salesOfficeName:
      sales?.partnerOfficeName ?? sales?.internalOfficeName ?? null,
  };
};

export const mapApiOfferListItem = (o: OffersOfferListItemResponse): OfferListItem => {
  const start = o.coverageTerm?.startDate?.slice(0, 10) ?? "";
  const end = o.coverageTerm?.endDate?.slice(0, 10) ?? "";
  return {
    id: o.id ?? "",
    number: o.id ?? "",
    productId: o.productId ?? "",
    productName: o.productName,
    policyPlan: o.policyPlan,
    currency: o.currency ?? "EUR",
    status: statusFromApi(o.status),
    createdDate: o.createdOnUtc?.slice(0, 10) ?? "",
    expiresOnUtc: o.expiresOnUtc ?? null,
    policyId: o.policyId ?? null,
    startDate: start,
    endDate: end,
    premium: o.firstPeriodChargePremium ?? 0,
    sumInsured: o.sumInsured ?? null,
    policyHolderName: o.policyHolderName,
    insuredName: o.insuredName,
    insuredAge: o.insuredAge,
    salesChannel: o.salesChannel,
    salesPartyName: o.salesPartyName,
    outstandingDocumentCount: o.outstandingDocumentCount ?? 0,
    raisedReviewFlagCount: o.raisedReviewFlagCount ?? 0,
    pendingDiscountRequestCount: o.pendingDiscountRequestCount ?? 0,
  };
};
