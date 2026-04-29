export type OfferStatus = "Draft" | "Quoted" | "Pending Review" | "Approved" | "Issued" | "Rejected";

export type PaymentMode =
  | "Pay all years upfront"
  | "Pay first year only"
  | "Annual payment schedule";

export type Beneficiary = {
  id: string;
  customerId: string;
  relationship: string;
  percentage: number;
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
  premium: number;
  status: OfferStatus;
  createdDate: string;
};

const seed: Offer[] = [
  {
    id: "OFR-0001", number: "OFR-2026-0001",
    productId: "PRD-001", versionId: "VRS-1001", templateId: "TPL-3002", currency: "EUR",
    policyHolderId: "CUS-0001", payerId: "CUS-0001", insuredId: "CUS-0001",
    beneficiaries: [
      { id: "b1", customerId: "CUS-0003", relationship: "Spouse", percentage: 60 },
      { id: "b2", customerId: "CUS-0004", relationship: "Child", percentage: 40 },
    ],
    startDate: "2026-05-01", endDate: "2046-05-01", termYears: 20,
    paymentMode: "Annual payment schedule",
    premium: 642, status: "Quoted", createdDate: "2026-04-22",
  },
  {
    id: "OFR-0002", number: "OFR-2026-0002",
    productId: "PRD-002", versionId: "VRS-1010", templateId: "TPL-3010", currency: "EUR",
    policyHolderId: "CUS-0004", payerId: "CUS-0004", insuredId: "CUS-0004",
    beneficiaries: [{ id: "b1", customerId: "CUS-0005", relationship: "Bank", percentage: 100 }],
    startDate: "2026-04-15", endDate: "2036-04-15", termYears: 10,
    paymentMode: "Pay all years upfront",
    loan: { amount: 180000, interestRate: 4.2, loanTermYears: 10, remainingYears: 10, outstandingBalance: 180000 },
    premium: 4820, status: "Pending Review", createdDate: "2026-04-20",
  },
  {
    id: "OFR-0003", number: "OFR-2026-0003",
    productId: "PRD-003", versionId: "VRS-1020", templateId: "TPL-3003", currency: "USD",
    policyHolderId: "CUS-0002", payerId: "CUS-0002", insuredId: "CUS-0002",
    beneficiaries: [{ id: "b1", customerId: "CUS-0006", relationship: "Sibling", percentage: 100 }],
    startDate: "2026-06-01", endDate: "2056-06-01", termYears: 30,
    paymentMode: "Annual payment schedule",
    premium: 1280, status: "Draft", createdDate: "2026-04-25",
  },
  {
    id: "OFR-0004", number: "OFR-2026-0004",
    productId: "PRD-001", versionId: "VRS-1001", templateId: "TPL-3001", currency: "EUR",
    policyHolderId: "CUS-0003", payerId: "CUS-0003", insuredId: "CUS-0003",
    beneficiaries: [{ id: "b1", customerId: "CUS-0001", relationship: "Friend", percentage: 100 }],
    startDate: "2026-03-15", endDate: "2046-03-15", termYears: 20,
    paymentMode: "Pay first year only",
    premium: 410, status: "Issued", createdDate: "2026-03-10",
  },
  {
    id: "OFR-0005", number: "OFR-2026-0005",
    productId: "PRD-001", versionId: "VRS-1001", templateId: "TPL-3003", currency: "EUR",
    policyHolderId: "CUS-0005", payerId: "CUS-0005", insuredId: "CUS-0005",
    beneficiaries: [{ id: "b1", customerId: "CUS-0006", relationship: "Daughter", percentage: 100 }],
    startDate: "2026-05-15", endDate: "2041-05-15", termYears: 15,
    paymentMode: "Annual payment schedule",
    premium: 980, status: "Approved", createdDate: "2026-04-18",
  },
  {
    id: "OFR-0006", number: "OFR-2026-0006",
    productId: "PRD-002", versionId: "VRS-1010", templateId: "TPL-3010", currency: "EUR",
    policyHolderId: "CUS-0006", payerId: "CUS-0006", insuredId: "CUS-0006",
    beneficiaries: [],
    startDate: "2026-04-10", endDate: "2031-04-10", termYears: 5,
    paymentMode: "Annual payment schedule",
    premium: 0, status: "Rejected", createdDate: "2026-04-08",
  },
];

let offers: Offer[] = [...seed];

export const listOffers = () => [...offers].sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1));
export const getOffer = (id: string) => offers.find((o) => o.id === id);

export const upsertOffer = (o: Offer) => {
  const i = offers.findIndex((x) => x.id === o.id);
  if (i >= 0) offers[i] = o;
  else offers = [o, ...offers];
};

export const setOfferStatus = (id: string, status: OfferStatus) => {
  const o = offers.find((x) => x.id === id);
  if (o) o.status = status;
};

export const newOfferId = () => {
  const n = offers.length + 1;
  const id = `OFR-${String(n).padStart(4, "0")}`;
  const number = `OFR-2026-${String(n).padStart(4, "0")}`;
  return { id, number };
};

export const statusColor: Record<OfferStatus, string> = {
  "Draft": "bg-muted text-muted-foreground",
  "Quoted": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "Pending Review": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Approved": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Issued": "bg-primary/15 text-primary",
  "Rejected": "bg-destructive/15 text-destructive",
};
