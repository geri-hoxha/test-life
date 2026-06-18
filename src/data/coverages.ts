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
  // ===== ISP family (PRD-069..074) =====
  // PRD-069 — ISP standart me tabele
  {
    id: "COV-2069A", productId: "PRD-069", versionId: "VRS-2069",
    name: "Humbja e jetes", code: "DTH",
    description: "Ne perputhje me Kushtet e Pergjithshme te Sigurimit kjo police mbulon: Humbja e jetes se te siguruarit brenda periudhes se sigurimit.",
    coverageType: "Mandatory", sumInsuredType: "Based on loan amount",
    defaultSumInsured: 0, minSumInsured: 1000, maxSumInsured: 500000,
    basePremiumType: "Rate table by age/gender", basePremiumValue: 0,
    commissionPct: 12, isActive: true,
  },
  // PRD-070 — ISP A_Mortgage Upfront
  {
    id: "COV-2070A", productId: "PRD-070", versionId: "VRS-2070",
    name: "Humbja e jetes", code: "DTH",
    description: "Ne perputhje me Kushtet e Pergjithshme te Sigurimit kjo police mbulon: Humbja e jetes se te siguruarit brenda periudhes se sigurimit.",
    coverageType: "Mandatory", sumInsuredType: "Based on loan amount",
    defaultSumInsured: 0, minSumInsured: 1000, maxSumInsured: 500000,
    basePremiumType: "Rate table by age/gender", basePremiumValue: 0,
    commissionPct: 12, isActive: true,
  },
  // PRD-071 — ISP PPI Konsumatore
  {
    id: "COV-2071A", productId: "PRD-071", versionId: "VRS-2071",
    name: "Humbja e jetes", code: "DTH",
    description: "Ne perputhje me Kushtet e Pergjithshme te Sigurimit kjo police mbulon: Humbja e jetes se te siguruarit brenda periudhes se sigurimit.",
    coverageType: "Mandatory", sumInsuredType: "Based on loan amount",
    defaultSumInsured: 0, minSumInsured: 500, maxSumInsured: 100000,
    basePremiumType: "Fixed amount", basePremiumValue: 20,
    commissionPct: 12, isActive: true,
  },
  // PRD-072 — ISP PPI Karta e Kreditit
  {
    id: "COV-2072A", productId: "PRD-072", versionId: "VRS-2072",
    name: "Humbja e jetes", code: "DTH",
    description: "Ne perputhje me Kushtet e Pergjithshme te Sigurimit kjo police mbulon: Humbja e jetes se te siguruarit brenda periudhes se sigurimit.",
    coverageType: "Mandatory", sumInsuredType: "Based on loan amount",
    defaultSumInsured: 0, minSumInsured: 500, maxSumInsured: 50000,
    basePremiumType: "Fixed amount", basePremiumValue: 15,
    commissionPct: 12, isActive: true,
  },
  {
    id: "COV-2072B", productId: "PRD-072", versionId: "VRS-2072",
    name: "Semundje Kritike", code: "CI",
    description: "Ne perputhje me Shtojcen 1. Kushte te veçanta per sigurimin e Semundjeve Kritike kjo police mbulon: Semundjet Kritike qe shfaqen per here te pare brenda periudhes se sigurimit dhe raportohen brenda kesaj periudhe. Periudha fillestare e pritjes per kete mbulim eshte 90 dite.",
    coverageType: "Optional Rider", sumInsuredType: "User entered",
    defaultSumInsured: 5000, minSumInsured: 1000, maxSumInsured: 25000,
    basePremiumType: "Percentage of insured amount", basePremiumValue: 0.28,
    commissionPct: 10, isActive: true,
  },
  // PRD-073 — ISP PPI Overdraft
  {
    id: "COV-2073A", productId: "PRD-073", versionId: "VRS-2073",
    name: "Humbja e jetes", code: "DTH",
    description: "Ne perputhje me Kushtet e Pergjithshme te Sigurimit kjo police mbulon: Humbja e jetes se te siguruarit brenda periudhes se sigurimit.",
    coverageType: "Mandatory", sumInsuredType: "Based on loan amount",
    defaultSumInsured: 0, minSumInsured: 500, maxSumInsured: 50000,
    basePremiumType: "Fixed amount", basePremiumValue: 15,
    commissionPct: 12, isActive: true,
  },
  {
    id: "COV-2073B", productId: "PRD-073", versionId: "VRS-2073",
    name: "Semundje Kritike", code: "CI",
    description: "Ne perputhje me Shtojcen 1. Kushte te veçanta per sigurimin e Semundjeve Kritike kjo police mbulon: Semundjet Kritike qe shfaqen per here te pare brenda periudhes se sigurimit dhe raportohen brenda kesaj periudhe. Periudha fillestare e pritjes per kete mbulim eshte 90 dite.",
    coverageType: "Optional Rider", sumInsuredType: "User entered",
    defaultSumInsured: 5000, minSumInsured: 1000, maxSumInsured: 25000,
    basePremiumType: "Percentage of insured amount", basePremiumValue: 0.28,
    commissionPct: 10, isActive: true,
  },
  // PRD-074 — ISP On-Vita (combined)
  {
    id: "COV-2074A", productId: "PRD-074", versionId: "VRS-2074",
    name: "Sigurimi i Jetes me Afat", code: "TL",
    description: "Ngjarja e sigurimit do te jete Humbja e jetes se te Siguruarit brenda periudhës se sigurimit.",
    coverageType: "Mandatory", sumInsuredType: "User entered",
    defaultSumInsured: 25000, minSumInsured: 5000, maxSumInsured: 200000,
    basePremiumType: "Rate table by age/gender", basePremiumValue: 0,
    commissionPct: 14, isActive: true,
  },
  {
    id: "COV-2074B", productId: "PRD-074", versionId: "VRS-2074",
    name: "Shpenzime mjekesore te shtrimit ne spital", code: "HOSP",
    description: "Shpenzime mjekesore te shtrimit ne spital si pasoje e nje Aksidenti ose nje Nderhyrje Kirurgjikale deri ne limitin vjetor te percaktuar ne formularin e polices. Ato mbulohen vetem nese jane kryer brenda periudhes se sigurimit per nje ngjarje te ndodhur brenda periudhes se sigurimit, ne nje spital te Rrjetit mjekesor ne Shqiperi te SIGAL.",
    coverageType: "Optional Rider", sumInsuredType: "Fixed",
    defaultSumInsured: 3000, minSumInsured: 1000, maxSumInsured: 10000,
    basePremiumType: "Fixed amount", basePremiumValue: 60,
    commissionPct: 10, isActive: true,
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
