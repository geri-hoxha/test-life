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
    name: "Sigurim i Jetes i Kombinuar",
    code: "05",
    status: "Active",
    currencies: ["EUR", "ALL", "USD"],
    activeVersion: "v3.2",
    createdDate: "Jan 12, 2025",
    type: "Life Insurance",
    description: "Sigurim jete me mbulim baze Death dhe mbulime shtese opsionale (aksident, paaftesi, semundje kritike).",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
  },
  {
    id: "PRD-002",
    name: "Jete e Debitorit Regular",
    code: "07",
    status: "Active",
    currencies: ["EUR", "ALL"],
    activeVersion: "v2.4",
    createdDate: "Mar 04, 2025",
    type: "Life Insurance",
    description: "Sigurim jete per debitorin me pagese primi te rregullt — mbulim baze Death, distribuim nepermjet bankave partnere.",
    requiredDocuments: ["ID document", "Loan agreement", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
  },
  {
    id: "PRD-003",
    name: "Jete e Debitorit Single",
    code: "08",
    status: "Active",
    currencies: ["EUR", "ALL"],
    activeVersion: "v2.1",
    createdDate: "Apr 18, 2025",
    type: "Life Insurance",
    description: "Sigurim jete per debitorin me pagese te vetme upfront per gjithe periudhen — mbulim baze Death.",
    requiredDocuments: ["ID document", "Loan agreement", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
  },
  {
    id: "PRD-004",
    name: "Sigurimi i Jetes i Kombinuar 09",
    code: "09",
    status: "Active",
    currencies: ["EUR", "ALL"],
    activeVersion: "v1.6",
    createdDate: "Jun 21, 2025",
    type: "Life Insurance",
    description: "Variant i kombinuar i sigurimit te jetes me mbulim baze Death dhe rider opsionale per aksident dhe paaftesi.",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: false },
  },
  {
    id: "PRD-005",
    name: "Sigurimi i Jetes i Kombinuar 10",
    code: "10",
    status: "Active",
    currencies: ["EUR", "ALL", "USD"],
    activeVersion: "v1.3",
    createdDate: "Aug 09, 2025",
    type: "Life Insurance",
    description: "Variant i zgjeruar i sigurimit te jetes te kombinuar — mbulim baze Death plus pakete e plote rider-ash opsionale.",
    requiredDocuments: ["ID document", "Medical report"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: true, compliance: true },
  },
  {
    id: "PRD-006",
    name: "Sigurim i Jetes me Kursim",
    code: "SJ",
    status: "Active",
    currencies: ["EUR", "ALL"],
    activeVersion: "v1.0",
    createdDate: "Oct 02, 2025",
    type: "Life Insurance",
    description: "Sigurim jete me komponent kursimi — mbulim baze Death me akumulim kapitali ne maturim dhe rider opsionale.",
    requiredDocuments: ["ID document", "Medical questionnaire", "Proof of income"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: false, manualUnderwriting: true, compliance: true },
  },
];

// In-memory store (demo only)
let products: Product[] = [...seedProducts];

export const listProducts = () => products;
export const getProduct = (id: string) => products.find((p) => p.id === id);
export const updateProductFlags = (id: string, flags: Product["flags"]) => {
  products = products.map((p) => (p.id === id ? { ...p, flags } : p));
  return products.find((p) => p.id === id);
};
export const updateProduct = (id: string, patch: Partial<Omit<Product, "id">>) => {
  products = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return products.find((p) => p.id === id);
};
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
