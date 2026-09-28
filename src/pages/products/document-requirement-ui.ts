import type {
  ProductsDocumentRequirementStage,
  ProductsDocumentReusePolicy,
} from "@/api/types";

export const DOCUMENT_STAGES: { value: ProductsDocumentRequirementStage; label: string }[] = [
  { value: "initialOffer", label: "Initial offer" },
  { value: "policyRenewal", label: "Policy renewal" },
];

export const DOCUMENT_REUSE_POLICIES: { value: ProductsDocumentReusePolicy; label: string }[] = [
  { value: "requireNewSubmission", label: "Require new submission" },
  { value: "reuseAcceptedWithinPolicy", label: "Reuse accepted within policy" },
];
