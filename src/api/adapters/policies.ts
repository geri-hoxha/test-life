/** Map Policies API ↔ UI `Policy` shape. Unsupported UI fields stay as placeholders. */

import type { PoliciesPolicyResponse } from "../types";
import type { Policy, PolicyCoverage, PolicyDocument, PolicyStatus } from "@/data/policies";
import type { OfferInsuredPerson, OfferParticipant, PaymentMode } from "@/data/offers";

const DEFAULT_PAYMENT: PaymentMode = "Pagesa me prim te rregullt";

const shareToPercentage = (share?: number | null) =>
  Math.round((share ?? 0) * 10000) / 100;

const mapParticipants = (p: PoliciesPolicyResponse): OfferParticipant[] =>
  (p.participants ?? []).map((x, i) => ({
    id: String(x.id ?? i),
    partyId: x.partyId ?? "",
    role: x.role ?? "policyHolder",
    partyType: x.partyType,
    uniqueIdentifier: x.uniqueIdentifier,
    displayName: x.displayName,
    countryCode: x.countryCode,
    isLeader: x.isLeader,
    share: x.share,
  }));

const mapInsuredPersons = (p: PoliciesPolicyResponse): OfferInsuredPerson[] =>
  (p.insuredPersons ?? []).map((x, i) => ({
    id: String(x.id ?? i),
    personId: x.personId ?? "",
    personalIdentifier: x.personalIdentifier,
    countryCode: x.countryCode,
    firstName: x.firstName,
    lastName: x.lastName,
    dateOfBirth: x.dateOfBirth,
    gender: x.gender,
    isPep: x.isPep,
  }));

const mapCoverages = (p: PoliciesPolicyResponse): PolicyCoverage[] =>
  (p.coverages ?? []).map((c, i) => ({
    id: String(c.id ?? i),
    coverageId: c.coverageId ?? "",
    coverageName: c.coverageName,
    coverageDescription: c.coverageDescription,
    sumInsured: c.sumInsured ?? 0,
    rateUsed: c.rateUsed
      ? {
          isFlat: c.rateUsed.isFlat,
          flatValue: c.rateUsed.flatValue,
          flatValueCurrency: c.rateUsed.flatValueCurrency,
          percentageValue: c.rateUsed.percentageValue,
        }
      : undefined,
    ratingTableMultiplierUsed: c.ratingTableMultiplierUsed,
    calculatedPremium: c.calculatedPremium ?? 0,
  }));

const mapDocuments = (p: PoliciesPolicyResponse): PolicyDocument[] =>
  (p.documents ?? []).map((d, i) => ({
    id: String(d.id ?? i),
    documentId: d.documentId,
    documentTypeId: d.documentTypeId ?? "",
  }));

const deriveStatus = (endDate: string): PolicyStatus => {
  if (!endDate) return "Active";
  const today = new Date().toISOString().slice(0, 10);
  return endDate < today ? "Expired" : "Active";
};

export const mapApiPolicy = (p: PoliciesPolicyResponse): Policy => {
  const participants = mapParticipants(p);
  const insuredPersons = mapInsuredPersons(p);
  const coverages = mapCoverages(p);
  const documents = mapDocuments(p);
  const holder = participants.find((x) => x.role === "policyHolder");
  const payer = participants.find((x) => x.role === "invoiced") ?? holder;
  const insured = insuredPersons[0];
  const beneficiaries = participants
    .filter((x) => x.role === "beneficiary")
    .map((x) => ({
      id: x.id,
      customerId: x.partyId,
      relationship: "N/A",
      percentage: shareToPercentage(x.share),
      displayName: x.displayName,
      partyType: x.partyType,
      uniqueIdentifier: x.uniqueIdentifier,
    }));

  const premium = coverages.reduce((sum, c) => sum + (c.calculatedPremium ?? 0), 0);

  const start = p.effectiveFromUtc?.slice(0, 10) ?? p.issuedOnUtc?.slice(0, 10) ?? "";
  const end = p.effectiveToUtc?.slice(0, 10) ?? start;
  const startYear = Number(start.slice(0, 4)) || new Date().getFullYear();
  const endYear = Number(end.slice(0, 4)) || startYear;

  return {
    id: p.id ?? "",
    number: p.id ?? "",
    offerId: p.offerId ?? "",
    offerScheduleYear: p.offerScheduleYear,
    productId: p.productId ?? "",
    versionId: "N/A",
    templateId: p.printableTemplateDocumentId ?? "N/A",
    currency: p.currency ?? "EUR",
    coverageText: p.coverageText,
    policyHolderId: holder?.partyId ?? "",
    payerId: payer?.partyId ?? "",
    insuredId: insured?.personId ?? "",
    beneficiaries,
    participants,
    insuredPersons,
    coverages,
    documents,
    startDate: start,
    endDate: end,
    termYears: Math.max(1, endYear - startYear),
    paymentMode: DEFAULT_PAYMENT,
    premium,
    status: deriveStatus(end),
    issueDate: p.issuedOnUtc?.slice(0, 10) ?? start,
    issuedBy: "N/A",
  };
};
