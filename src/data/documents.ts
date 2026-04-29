export type DocumentRequiredFor = "Policy Holder" | "Insured Person" | "Beneficiary" | "Payer";

export type DocumentAppliesWhen =
  | "Always"
  | "Sum insured above threshold"
  | "PEP detected"
  | "Manual verification required";

export type ProductDocument = {
  id: string;
  productId: string;
  versionId: string;
  name: string;
  requiredFor: DocumentRequiredFor[];
  isMandatory: boolean;
  appliesWhen: DocumentAppliesWhen;
  thresholdAmount?: number;
  notes?: string;
};

const seed: ProductDocument[] = [
  {
    id: "DOC-4001", productId: "PRD-001", versionId: "VRS-1001",
    name: "ID Card / Passport",
    requiredFor: ["Policy Holder", "Insured Person", "Beneficiary"],
    isMandatory: true, appliesWhen: "Always",
    notes: "Government-issued photo ID. Both sides scanned.",
  },
  {
    id: "DOC-4002", productId: "PRD-001", versionId: "VRS-1001",
    name: "Medical Declaration",
    requiredFor: ["Insured Person"],
    isMandatory: true, appliesWhen: "Sum insured above threshold",
    thresholdAmount: 100000,
    notes: "Required when sum insured exceeds €100,000. Self-declaration form.",
  },
  {
    id: "DOC-4003", productId: "PRD-001", versionId: "VRS-1001",
    name: "Beneficiary Declaration",
    requiredFor: ["Beneficiary"],
    isMandatory: true, appliesWhen: "Always",
    notes: "Identifies and acknowledges named beneficiaries.",
  },
  {
    id: "DOC-4004", productId: "PRD-001", versionId: "VRS-1001",
    name: "PEP Declaration",
    requiredFor: ["Policy Holder", "Payer"],
    isMandatory: true, appliesWhen: "PEP detected",
    notes: "Signed declaration of politically exposed person status.",
  },
  {
    id: "DOC-4010", productId: "PRD-002", versionId: "VRS-1010",
    name: "ID Card / Passport",
    requiredFor: ["Policy Holder", "Insured Person"],
    isMandatory: true, appliesWhen: "Always",
  },
  {
    id: "DOC-4011", productId: "PRD-002", versionId: "VRS-1010",
    name: "Loan Agreement",
    requiredFor: ["Policy Holder"],
    isMandatory: true, appliesWhen: "Always",
    notes: "Bank-issued loan contract used to compute insured amount.",
  },
];

let docs: ProductDocument[] = [...seed];

export const listDocuments = (productId: string, versionId?: string) =>
  docs.filter((d) => d.productId === productId && (!versionId || d.versionId === versionId));

export const upsertDocument = (d: ProductDocument) => {
  const i = docs.findIndex((x) => x.id === d.id);
  if (i >= 0) docs[i] = d;
  else docs = [d, ...docs];
};

export const deleteDocument = (id: string) => {
  docs = docs.filter((d) => d.id !== id);
};

export const newDocumentId = () =>
  `DOC-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;

export const SUGGESTED_DOCUMENTS = [
  "ID Card / Passport",
  "Loan Agreement",
  "Medical Declaration",
  "Beneficiary Declaration",
  "PEP Declaration",
  "Proof of Income",
  "Proof of Address",
  "Bank Statement",
];
