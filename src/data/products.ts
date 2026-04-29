export type ProductStatus = "Draft" | "Active" | "Inactive";

export type Product = {
  id: string;
  name: string;
  code: string;
  status: ProductStatus;
  currencies: string[];
  activeVersion: string;
  createdDate: string;
  type: string;
  description: string;
  requiredDocuments: string[];
  flags: {
    pep: boolean;
    highInsuredAmount: boolean;
    totalExposure: boolean;
    manualUnderwriting: boolean;
    compliance: boolean;
  };
};

export const seedProducts: Product[] = [
  {
    id: "PRD-001",
    name: "TermLife Plus 20Y",
    code: "TL-PLUS-20",
    status: "Active",
    currencies: ["EUR", "USD"],
    activeVersion: "v3.2",
    createdDate: "Jan 12, 2025",
    type: "Life Insurance",
    description: "20-year term life with optional critical illness rider.",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
  },
  {
    id: "PRD-002",
    name: "TermLife Basic 10Y",
    code: "TL-BASIC-10",
    status: "Active",
    currencies: ["EUR", "ALL"],
    activeVersion: "v2.0",
    createdDate: "Mar 04, 2025",
    type: "Life Insurance",
    description: "Affordable 10-year term life policy.",
    requiredDocuments: ["ID document"],
    flags: { pep: true, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: false },
  },
  {
    id: "PRD-003",
    name: "WholeLife Premium",
    code: "WL-PREM",
    status: "Active",
    currencies: ["EUR", "USD", "ALL"],
    activeVersion: "v1.4",
    createdDate: "Jun 21, 2025",
    type: "Life Insurance",
    description: "Whole-life cover with cash-value accumulation.",
    requiredDocuments: ["ID document", "Medical report", "Proof of income"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: true, compliance: true },
  },
  {
    id: "PRD-004",
    name: "Endowment 15Y",
    code: "END-15",
    status: "Draft",
    currencies: ["EUR"],
    activeVersion: "v0.9",
    createdDate: "Feb 10, 2026",
    type: "Life Insurance",
    description: "Savings-oriented endowment with guaranteed maturity benefit.",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: false, highInsuredAmount: true, totalExposure: false, manualUnderwriting: true, compliance: false },
  },
  {
    id: "PRD-005",
    name: "TermLife Plus 30Y",
    code: "TL-PLUS-30",
    status: "Inactive",
    currencies: ["EUR", "USD"],
    activeVersion: "v2.1",
    createdDate: "Sep 14, 2024",
    type: "Life Insurance",
    description: "Long-term 30-year coverage, retired in favor of v3 family.",
    requiredDocuments: ["ID document", "Medical report"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
  },
];

// In-memory store (demo only)
let products: Product[] = [...seedProducts];

export const listProducts = () => products;
export const getProduct = (id: string) => products.find((p) => p.id === id);
export const addProduct = (p: Omit<Product, "id" | "activeVersion" | "createdDate">) => {
  const id = `PRD-${String(products.length + 1).padStart(3, "0")}`;
  const created: Product = {
    ...p,
    id,
    activeVersion: "v0.1",
    createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  };
  products = [created, ...products];
  return created;
};
