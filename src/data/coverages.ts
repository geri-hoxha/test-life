export type CoverageType = "Mandatory" | "Optional Rider";
export type SumInsuredType = "Fixed" | "User entered" | "Based on loan amount";
export type BasePremiumType = "Fixed amount" | "Percentage of insured amount" | "Rate table by age/gender";

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
};

const seed: Coverage[] = [
  // PRD-001 / VRS-1001 (Active v3.2)
  {
    id: "COV-2001", productId: "PRD-001", versionId: "VRS-1001",
    name: "Death Cover", code: "DTH",
    description: "Lump-sum payout to beneficiaries on death of the insured.",
    coverageType: "Mandatory", sumInsuredType: "Fixed",
    defaultSumInsured: 50000, minSumInsured: 10000, maxSumInsured: 500000,
    basePremiumType: "Rate table by age/gender", basePremiumValue: 0,
    commissionPct: 12, isActive: true,
  },
  {
    id: "COV-2002", productId: "PRD-001", versionId: "VRS-1001",
    name: "Total & Permanent Disability", code: "TPD",
    description: "Payout if the insured becomes totally and permanently disabled.",
    coverageType: "Optional Rider", sumInsuredType: "User entered",
    defaultSumInsured: 25000, minSumInsured: 5000, maxSumInsured: 250000,
    basePremiumType: "Percentage of insured amount", basePremiumValue: 0.18,
    commissionPct: 10, isActive: true,
  },
  {
    id: "COV-2003", productId: "PRD-001", versionId: "VRS-1001",
    name: "Critical Illness", code: "CI",
    description: "Lump-sum payout on diagnosis of a covered critical illness.",
    coverageType: "Optional Rider", sumInsuredType: "User entered",
    defaultSumInsured: 20000, minSumInsured: 5000, maxSumInsured: 150000,
    basePremiumType: "Percentage of insured amount", basePremiumValue: 0.32,
    commissionPct: 10, isActive: true,
  },
  {
    id: "COV-2004", productId: "PRD-001", versionId: "VRS-1001",
    name: "Accidental Death Benefit", code: "ADB",
    description: "Additional payout if death occurs due to an accident.",
    coverageType: "Optional Rider", sumInsuredType: "Fixed",
    defaultSumInsured: 10000, minSumInsured: 5000, maxSumInsured: 50000,
    basePremiumType: "Fixed amount", basePremiumValue: 24,
    commissionPct: 8, isActive: false,
  },
  // PRD-001 / VRS-1003 draft has none yet
  // PRD-003 / VRS-1020 WholeLife
  {
    id: "COV-2010", productId: "PRD-003", versionId: "VRS-1020",
    name: "Whole Life Cover", code: "WLC",
    description: "Lifetime death benefit with cash value accumulation.",
    coverageType: "Mandatory", sumInsuredType: "User entered",
    defaultSumInsured: 100000, minSumInsured: 25000, maxSumInsured: 1000000,
    basePremiumType: "Rate table by age/gender", basePremiumValue: 0,
    commissionPct: 14, isActive: true,
  },
  // PRD-002 basic
  {
    id: "COV-2020", productId: "PRD-002", versionId: "VRS-1010",
    name: "Loan Protection", code: "LPC",
    description: "Outstanding loan balance is paid off on death of borrower.",
    coverageType: "Mandatory", sumInsuredType: "Based on loan amount",
    defaultSumInsured: 0, minSumInsured: 1000, maxSumInsured: 200000,
    basePremiumType: "Percentage of insured amount", basePremiumValue: 0.45,
    commissionPct: 9, isActive: true,
  },
];

let coverages: Coverage[] = [...seed];

export const listCoverages = (productId: string, versionId?: string) =>
  coverages.filter((c) => c.productId === productId && (!versionId || c.versionId === versionId));

export const upsertCoverage = (c: Coverage) => {
  const i = coverages.findIndex((x) => x.id === c.id);
  if (i >= 0) coverages[i] = c;
  else coverages = [c, ...coverages];
};

export const deleteCoverage = (id: string) => {
  coverages = coverages.filter((c) => c.id !== id);
};

export const newCoverageId = () =>
  `COV-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;
