/** Map document-types / product-document-types API ↔ UI `ProductDocument` shape. */

import type {
  DocumentsDocumentTypesDocumentTypeResponse,
  ProductsProductDocumentTypeResponse,
} from "../types";
import type { DocumentAppliesWhen, ProductDocument } from "@/data/documents";

export const mapProductDocumentType = (
  productId: string,
  entry: ProductsProductDocumentTypeResponse,
  catalog?: DocumentsDocumentTypesDocumentTypeResponse
): ProductDocument => {
  const rf = entry.requiredFor;
  let appliesWhen: DocumentAppliesWhen = "Always";
  let thresholdAmount: number | undefined;

  if (rf?.isPep) {
    appliesWhen = "PEP detected";
  } else if (rf?.insuredAmountOver != null && rf.insuredAmountOver > 0) {
    appliesWhen = "Sum insured above threshold";
    thresholdAmount = rf.insuredAmountOver;
  }

  return {
    id: String(entry.id ?? entry.documentTypeId ?? ""),
    productId,
    versionId: "N/A",
    name: catalog?.name?.trim() || "N/A",
    requiredFor: ["Policy Holder"],
    isMandatory: Boolean(rf?.alwaysRequired),
    appliesWhen,
    thresholdAmount,
    notes: catalog?.description ?? "",
  };
};
