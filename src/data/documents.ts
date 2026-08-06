export type DocumentRequiredFor = "Policy Holder" | "Insured Person" | "Beneficiary" | "Payer";

export type DocumentAppliesWhen =
  | "Always"
  | "Sum insured above threshold"
  | "Total exposure above threshold"
  | "Age above threshold"
  | "PEP detected"
  | "Manual verification required"
  | "Conditional";

export type ProductDocument = {
  id: string;
  productId: string;
  versionId: string;
  name: string;
  requiredFor: DocumentRequiredFor[];
  isMandatory: boolean;
  appliesWhen: DocumentAppliesWhen;
  thresholdAmount?: number;
  /** Catalog document-type id when linking an existing type. */
  documentTypeId?: string;
  /** Template file from documents API, used when creating a catalog document type. */
  templateDocumentId?: string | null;
  /** Product document-type rules (API). */
  insuredAmountOver?: number | null;
  totalExposureOver?: number | null;
  ageOver?: number | null;
  isPep?: boolean | null;
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

export const newDocumentId = () =>
  `DOC-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;
