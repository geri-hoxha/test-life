/** Map document-types / product-document-types API ↔ UI `ProductDocument` shape. */

import type {
  DocumentsDocumentTypesDocumentTypeResponse,
  ProductsProductDocumentTypeResponse,
} from "../types";
import type { DocumentAppliesWhen, ProductDocument } from "@/data/documents";

const deriveAppliesWhen = (rf?: {
  alwaysRequired?: boolean;
  insuredAmountOver?: number | null;
  totalExposureOver?: number | null;
  ageOver?: number | null;
  isPep?: boolean | null;
}): { appliesWhen: DocumentAppliesWhen; thresholdAmount?: number } => {
  if (!rf) return { appliesWhen: "Always" };

  const flags = [
    rf.alwaysRequired,
    rf.isPep,
    rf.insuredAmountOver != null && rf.insuredAmountOver > 0,
    rf.totalExposureOver != null && rf.totalExposureOver > 0,
    rf.ageOver != null && rf.ageOver > 0,
  ].filter(Boolean).length;

  if (flags > 1 && !rf.alwaysRequired) {
    return { appliesWhen: "Conditional" };
  }
  if (rf.alwaysRequired) return { appliesWhen: "Always" };
  if (rf.isPep) return { appliesWhen: "PEP detected" };
  if (rf.insuredAmountOver != null && rf.insuredAmountOver > 0) {
    return { appliesWhen: "Sum insured above threshold", thresholdAmount: rf.insuredAmountOver };
  }
  if (rf.totalExposureOver != null && rf.totalExposureOver > 0) {
    return { appliesWhen: "Total exposure above threshold", thresholdAmount: rf.totalExposureOver };
  }
  if (rf.ageOver != null && rf.ageOver > 0) {
    return { appliesWhen: "Age above threshold", thresholdAmount: rf.ageOver };
  }
  return { appliesWhen: "Always" };
};

export const mapProductDocumentType = (
  productId: string,
  entry: ProductsProductDocumentTypeResponse,
  catalog?: DocumentsDocumentTypesDocumentTypeResponse
): ProductDocument => {
  const rf = entry.requiredFor;
  const { appliesWhen, thresholdAmount } = deriveAppliesWhen(rf);

  return {
    id: String(entry.id ?? entry.documentTypeId ?? ""),
    productId,
    versionId: "N/A",
    name: catalog?.name?.trim() || "N/A",
    requiredFor: ["Policy Holder"],
    isMandatory: Boolean(rf?.alwaysRequired),
    appliesWhen,
    thresholdAmount,
    documentTypeId: entry.documentTypeId,
    templateDocumentId: catalog?.templateDocumentId ?? null,
    insuredAmountOver: rf?.insuredAmountOver ?? null,
    totalExposureOver: rf?.totalExposureOver ?? null,
    ageOver: rf?.ageOver ?? null,
    isPep: rf?.isPep ?? null,
    notes: catalog?.description ?? "",
  };
};
