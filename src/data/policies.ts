import type { Beneficiary, PaymentMode } from "./offers";

export type PolicyStatus = "Active" | "Pending Payment" | "Cancelled" | "Expired" | "Lapsed";

export type Policy = {
  id: string;
  number: string;
  offerId: string;
  productId: string;
  versionId: string;
  templateId: string;
  currency: string;
  policyHolderId: string;
  payerId: string;
  insuredId: string;
  beneficiaries: Beneficiary[];
  startDate: string;
  endDate: string;
  termYears: number;
  paymentMode: PaymentMode;
  premium: number;
  status: PolicyStatus;
  issueDate: string;
  issuedBy: string;
};

const seed: Policy[] = [
  {
    id: "POL-0001", number: "POL-2026-0001", offerId: "OFR-0004",
    productId: "PRD-001", versionId: "VRS-1001", templateId: "TPL-3001", currency: "EUR",
    policyHolderId: "CUS-0001", payerId: "CUS-0001", insuredId: "CUS-0001",
    beneficiaries: [{ id: "b1", customerId: "CUS-0003", relationship: "Spouse", percentage: 100 }],
    startDate: "2026-04-01", endDate: "2046-04-01", termYears: 20,
    paymentMode: "Annual payment schedule",
    premium: 615, status: "Active",
    issueDate: "2026-04-01", issuedBy: "Anna Kovač",
  },
];

let policies: Policy[] = [...seed];

export const listPolicies = () => [...policies].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
export const getPolicy = (id: string) => policies.find((p) => p.id === id);
export const getPolicyByOffer = (offerId: string) => policies.find((p) => p.offerId === offerId);

export const upsertPolicy = (p: Policy) => {
  const i = policies.findIndex((x) => x.id === p.id);
  if (i >= 0) policies[i] = p;
  else policies = [p, ...policies];
};

export const newPolicyId = () => {
  const n = policies.length + 1;
  return {
    id: `POL-${String(n).padStart(4, "0")}`,
    number: `POL-2026-${String(n).padStart(4, "0")}`,
  };
};

export const policyStatusColor: Record<PolicyStatus, string> = {
  "Active": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Pending Payment": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "Lapsed": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Cancelled": "bg-destructive/15 text-destructive",
  "Expired": "bg-muted text-muted-foreground",
};
