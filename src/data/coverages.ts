export type CoverageType = "Mandatory" | "Optional Rider";
export type SumInsuredType = "Fixed" | "User entered" | "Based on loan amount";
export type BasePremiumType = "Fixed amount" | "Percentage of insured amount" | "Rate table by age/gender";

export type CoverageCurrencyLimit = {
  id?: string | number;
  currency?: string;
  type?: string;
  value?: number;
};

export type Coverage = {
  id: string;
  productId: string;
  versionId: string;
  name: string;
  code: string;
  description?: string;
  coverageType: CoverageType;
  sumInsuredType: SumInsuredType;
  defaultSumInsured: number;
  minSumInsured: number;
  maxSumInsured: number;
  basePremiumType: BasePremiumType;
  basePremiumValue: number; // amount, percent, or table reference id
  commissionPct: number;
  isActive: boolean;
  /** Product-coverage link: rating table used for premium calculation. */
  ratingTableId?: string;
  ratingTableMultiplier?: number;
  isSumInsuredFixed?: boolean;
  sumInsuredPercentage?: number;
  /** Product-coverage link sort order from API. */
  sortOrder?: number;
  /** Product-coverage link currency limits from API. */
  currencyLimits?: CoverageCurrencyLimit[];
};

export const newCoverageId = () =>
  `COV-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;
