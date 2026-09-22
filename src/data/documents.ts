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
  insuredAmountCurrency?: string | null;
  totalExposureOver?: number | null;
  totalExposureCurrency?: string | null;
  ageOver?: number | null;
  isPep?: boolean | null;
  isForeignCitizen?: boolean | null;
  stages?: "none" | "initialOffer" | "policyRenewal";
  reusePolicy?: "requireNewSubmission" | "reuseAcceptedWithinPolicy";
  notes?: string;
};

export const newDocumentId = () =>
  `DOC-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;
