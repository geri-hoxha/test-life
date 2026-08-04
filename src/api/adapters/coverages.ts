/** Map Coverages / product-coverage API ↔ UI `Coverage` shape. Unsupported fields use defaults. */

import type {
  CoveragesCoverageResponse,
  ProductsProductCoverageResponse,
} from "../types";
import type { Coverage } from "@/data/coverages";

export const mapProductCoverage = (
  productId: string,
  entry: ProductsProductCoverageResponse,
  catalog?: CoveragesCoverageResponse
): Coverage => ({
  id: String(entry.id ?? entry.coverageId ?? ""),
  productId,
  versionId: "N/A",
  name: catalog?.name?.trim() || "N/A",
  code: entry.coverageId ?? "N/A",
  description: catalog?.description ?? "",
  coverageType: entry.isMandatory ? "Mandatory" : "Optional Rider",
  sumInsuredType: "Fixed",
  defaultSumInsured: 0,
  minSumInsured: 0,
  maxSumInsured: 0,
  basePremiumType: "Rate table by age/gender",
  basePremiumValue: 0,
  commissionPct: 0,
  isActive: true,
});
