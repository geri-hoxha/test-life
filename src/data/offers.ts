export type OfferStatus =
  | "Draft"
  | "Quoted"
  | "Bound"
  | "Cancelled"
  | "Expired";

export type PaymentMode =
  | "Pagesa me prim te rregullt"
  | "Pagese per gjithe periudhen (Upfront)"
  | "Pagesa me tarife te vetme për të gjithë periudhën"
  | "Pagesa me prim fiks mujor"
  | "Pagesa me prim fiks vjetor"
  | "Pagesa me prim te paracaktuar, kjo eshte e velfshme per sigurimin e jetes se kombinuar Protect, Sigurimi i jetes se kombinuar ISP";

export type Beneficiary = {
  id: string;
  customerId: string;
  relationship: string;
  percentage: number;
  displayName?: string;
  partyType?: "person" | "company";
  uniqueIdentifier?: string;
};

export type OfferParticipant = {
  id: string;
  partyId: string;
  role: "policyHolder" | "invoiced" | "beneficiary";
  partyType?: "person" | "company";
  uniqueIdentifier?: string;
  displayName?: string;
  countryCode?: string;
  isLeader?: boolean;
  share?: number | null;
  relationshipToInsured?: string | null;
};

export type OfferInsuredPerson = {
  id: string;
  personId: string;
  personalIdentifier?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
};

export type OfferYearCoverage = {
  id: string;
  coverageId: string;
  sumInsured: number;
  rateUsed?: {
    isFlat?: boolean;
    flatValue?: number | null;
    flatValueCurrency?: string | null;
    percentageValue?: number | null;
  };
  ratingTableMultiplierUsed?: number;
  calculatedPremium: number;
};

export type OfferDocumentRequirement = {
  id: string;
  documentId?: string | null;
  documentTypeId: string;
  status: "required" | "submitted" | "accepted" | "refused" | "waived";
  submissionSource?: string | null;
  refusalReason?: string | null;
  waiverReason?: string | null;
  isSatisfied?: boolean;
  submittedOnUtc?: string | null;
  decidedOnUtc?: string | null;
};

export type OfferDiscountRequest = {
  id: string;
  requestedDiscountPercentage: number;
  reason: string;
  status: "requested" | "approved" | "rejected";
  targetPeriodSequence?: number | null;
  requestedOnUtc?: string;
  decidedOnUtc?: string | null;
};

export type OfferReviewFlag = {
  id: string;
  type: string;
  reason: string;
  status: string;
  raisedOnUtc?: string;
  resolvedOnUtc?: string | null;
  resolutionNote?: string | null;
};

export type OfferYear = {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  insuredAmount: number;
  premium: number;
  payPremium: number;
  internalStatus?: string;
  policyId?: string | null;
  openingBalance?: number | null;
  closingBalance?: number | null;
  coverages: OfferYearCoverage[];
};

export type OfferLoanDisbursement = {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  remainingLoanAmount: number;
  closingBalance?: number | null;
};

export type OfferLoanSubmission = {
  id: string;
  sourceSystem: string;
  externalReference?: string | null;
  receivedOnUtc?: string;
};

export type OfferListItem = {
  id: string;
  number: string;
  productId: string;
  productName?: string | null;
  policyPlan?: string;
  currency: string;
  status: OfferStatus;
  createdDate: string;
  expiresOnUtc?: string | null;
  policyId?: string | null;
  startDate: string;
  endDate: string;
  premium: number;
  sumInsured?: number | null;
  policyHolderName?: string | null;
  insuredName?: string | null;
  insuredAge?: number | null;
  salesChannel?: string | null;
  salesPartyName?: string | null;
  outstandingDocumentCount: number;
  raisedReviewFlagCount: number;
  pendingDiscountRequestCount: number;
};

export type Offer = {
  id: string;
  number: string;
  productId: string;
  versionId: string;
  templateId: string;
  currency: string;
  policyPlan?: string;
  requiresLoanBalances?: boolean;
  policyId?: string | null;
  renewedFromPolicyId?: string | null;
  policyHolderId: string;
  payerId: string;
  insuredId: string;
  beneficiaries: Beneficiary[];
  participants: OfferParticipant[];
  insuredPersons: OfferInsuredPerson[];
  startDate: string;
  endDate: string;
  termYears: number;
  paymentMode: PaymentMode;
  loan?: {
    amount: number;
    interestRate: number;
    loanTermYears: number;
    remainingYears: number;
    outstandingBalance: number;
  };
  loanDisbursements: OfferLoanDisbursement[];
  loanSubmissions: OfferLoanSubmission[];
  offerYears: OfferYear[];
  documentRequirements: OfferDocumentRequirement[];
  reviewFlags: OfferReviewFlag[];
  discountRequests: OfferDiscountRequest[];
  premium: number;
  status: OfferStatus;
  createdDate: string;
  quotedOnUtc?: string | null;
  salesChannel?: string | null;
  salesPartyName?: string | null;
  salesAgentName?: string | null;
  salesPartnerName?: string | null;
  salesOfficeName?: string | null;
};

export const statusColor: Record<OfferStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Quoted: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Bound: "bg-primary/15 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
  Expired: "bg-muted text-muted-foreground",
};

/** API query value ↔ UI label */
export const offerStatusToApi: Record<OfferStatus, string> = {
  Draft: "draft",
  Quoted: "quoted",
  Bound: "bound",
  Cancelled: "cancelled",
  Expired: "expired",
};
