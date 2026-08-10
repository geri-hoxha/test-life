export type OfferStatus =
  | "Draft"
  | "Quoted"
  | "Partially Bound"
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
  isPep?: boolean;
};

export type OfferScheduleCoverage = {
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

export type OfferScheduleDocument = {
  id: string;
  documentId?: string | null;
  documentTypeId: string;
  status: "required" | "submitted" | "accepted" | "refused";
  refusalReason?: string | null;
};

export type OfferScheduleDiscountRequest = {
  id: string;
  requestedDiscountPercentage: number;
  reason: string;
  status: "requested" | "approved" | "rejected";
};

export type OfferScheduleReviewFlag = {
  id: string;
  type: string;
  reason: string;
  status: string;
  raisedOnUtc?: string;
  resolvedOnUtc?: string | null;
};

export type OfferSchedule = {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  insuredAmount: number;
  premium: number;
  internalStatus?: string;
  policyId?: string | null;
  coverages: OfferScheduleCoverage[];
  documents: OfferScheduleDocument[];
  discountRequests: OfferScheduleDiscountRequest[];
  reviewFlags: OfferScheduleReviewFlag[];
};

export type OfferLoanDisbursement = {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  remainingLoanAmount: number;
};

export type Offer = {
  id: string;
  number: string;
  // Step 1
  productId: string;
  versionId: string;
  templateId: string;
  currency: string;
  // Step 2
  policyHolderId: string;
  payerId: string;
  insuredId: string;
  beneficiaries: Beneficiary[];
  participants: OfferParticipant[];
  insuredPersons: OfferInsuredPerson[];
  // Step 3
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
  schedules: OfferSchedule[];
  premium: number;
  status: OfferStatus;
  createdDate: string;
};

const emptyApiCollections = {
  participants: [] as OfferParticipant[],
  insuredPersons: [] as OfferInsuredPerson[],
  loanDisbursements: [] as OfferLoanDisbursement[],
  schedules: [] as OfferSchedule[],
};

const seed: Offer[] = [
  // 1) Draft — Premium Life Plus, USD, Mira Leka exploring options
  {
    id: "OFR-0001", number: "OFR-2026-0001",
    productId: "PRD-003", versionId: "VRS-1020", templateId: "TPL-3003", currency: "USD",
    policyHolderId: "CUS-0004", payerId: "CUS-0004", insuredId: "CUS-0004",
    beneficiaries: [
      { id: "b1", customerId: "CUS-0001", relationship: "Father", percentage: 100 },
    ],
    ...emptyApiCollections,
    startDate: "2026-06-01", endDate: "2056-06-01", termYears: 30,
    paymentMode: "Pagesa me prim te rregullt",
    premium: 1180, status: "Draft", createdDate: "2026-04-26",
  },
  // 2) Pending Review — PEP-flagged client (Elira Dervishi)
  {
    id: "OFR-0002", number: "OFR-2026-0002",
    productId: "PRD-002", versionId: "VRS-1010", templateId: "TPL-3010", currency: "EUR",
    policyHolderId: "CUS-0002", payerId: "CUS-0002", insuredId: "CUS-0002",
    beneficiaries: [
      { id: "b1", customerId: "CUS-0004", relationship: "Sister", percentage: 100 },
    ],
    ...emptyApiCollections,
    startDate: "2026-05-01", endDate: "2036-05-01", termYears: 10,
    paymentMode: "Pagesa me prim te rregullt",
    premium: 720, status: "Partially Bound", createdDate: "2026-04-22",
  },
  // 3) Quoted — Standard Life Insurance for Dritan Kola, ALL currency
  {
    id: "OFR-0003", number: "OFR-2026-0003",
    productId: "PRD-002", versionId: "VRS-1010", templateId: "TPL-3010", currency: "ALL",
    policyHolderId: "CUS-0003", payerId: "CUS-0003", insuredId: "CUS-0003",
    beneficiaries: [
      { id: "b1", customerId: "CUS-0004", relationship: "Daughter", percentage: 60 },
      { id: "b2", customerId: "CUS-0001", relationship: "Brother", percentage: 40 },
    ],
    ...emptyApiCollections,
    startDate: "2026-05-15", endDate: "2036-05-15", termYears: 10,
    paymentMode: "Pagesa me prim te rregullt",
    premium: 84000, status: "Quoted", createdDate: "2026-04-18",
  },
  // 4) Bound — Bank Loan Life Protection for Arben Hoxha (linked to policy below)
  {
    id: "OFR-0004", number: "OFR-2026-0004",
    productId: "PRD-001", versionId: "VRS-1001", templateId: "TPL-3001", currency: "EUR",
    policyHolderId: "CUS-0001", payerId: "CUS-0001", insuredId: "CUS-0001",
    beneficiaries: [
      { id: "b1", customerId: "CUS-0003", relationship: "Spouse", percentage: 100 },
    ],
    ...emptyApiCollections,
    startDate: "2026-04-01", endDate: "2046-04-01", termYears: 20,
    paymentMode: "Pagesa me prim te rregullt",
    loan: { amount: 145000, interestRate: 4.5, loanTermYears: 20, remainingYears: 20, outstandingBalance: 145000 },
    premium: 615, status: "Bound", createdDate: "2026-03-22",
  },
];

let offers: Offer[] = [...seed];

export const getOffer = (id: string) => offers.find((o) => o.id === id);

export const statusColor: Record<OfferStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Quoted: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "Partially Bound": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Bound: "bg-primary/15 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
  Expired: "bg-muted text-muted-foreground",
};

/** API query value ↔ UI label */
export const offerStatusToApi: Record<OfferStatus, string> = {
  Draft: "draft",
  Quoted: "quoted",
  "Partially Bound": "partiallyBound",
  Bound: "bound",
  Cancelled: "cancelled",
  Expired: "expired",
};
