export type PremiumOverrideType =
  | "No override"
  | "Fixed discount"
  | "Percentage discount"
  | "Fixed premium"
  | "Management approved manual premium";

export type PaymentType =
  | "Payment with regulated premium"
  | "Single premium payment"
  | "Flexible premium payment"
  | "Bank-financed premium";

export type RenewalType =
  | "According to the bank information"
  | "Automatic annual renewal"
  | "Manual renewal on request"
  | "Non-renewable";

export type TemplateTypeCode = "LP" | "RP" | "SP" | "GP" | "BP";

export type LoanType =
  | "Personal loan"
  | "Mortgage loan"
  | "Business loan"
  | "Consumer loan"
  | "Not applicable";

export type PolicyTypeCode =
  | "D1V - Up to 1 year"
  | "D5V - Up to 5 years"
  | "D10V - Up to 10 years"
  | "D20V - Up to 20 years"
  | "WL - Whole life";

export type SellerType = "Agent" | "Bank" | "Branch";

export type SellerEntity = {
  id: string;
  name: string;
  type: SellerType;
  code?: string;
};

export const SELLER_DIRECTORY: SellerEntity[] = [
  { id: "AGT-001", name: "Arben Hoxha",        type: "Agent",  code: "AG-AH-001" },
  { id: "AGT-002", name: "Erida Kola",         type: "Agent",  code: "AG-EK-002" },
  { id: "AGT-003", name: "Besnik Rama",        type: "Agent",  code: "AG-BR-003" },
  { id: "AGT-004", name: "Mirela Hysa",        type: "Agent",  code: "AG-MH-004" },
  { id: "BNK-001", name: "BKT — Tirana HQ",    type: "Bank",   code: "BKT-TR-HQ" },
  { id: "BNK-002", name: "BKT — Durres",       type: "Branch", code: "BKT-DR-01" },
  { id: "BNK-003", name: "Raiffeisen — Tirana",type: "Bank",   code: "RBA-TR-HQ" },
  { id: "BNK-004", name: "Raiffeisen — Vlore", type: "Branch", code: "RBA-VL-01" },
  { id: "BNK-005", name: "Credins — Tirana",   type: "Bank",   code: "CRD-TR-HQ" },
  { id: "BNK-006", name: "Credins — Shkoder",  type: "Branch", code: "CRD-SH-01" },
  { id: "BNK-007", name: "Intesa Sanpaolo Albania", type: "Bank", code: "ISP-AL-HQ" },
  { id: "BNK-008", name: "OTP Bank — Tirana",  type: "Bank",   code: "OTP-TR-HQ" },
];

export type Template = {
  id: string;
  productId: string;
  versionId: string;
  name: string;
  description?: string;
  includedCoverageIds: string[];
  optionalRiderIds: string[];
  defaultCurrency: string;
  allowedCurrencies: string[];
  premiumOverrideType: PremiumOverrideType;
  premiumOverrideValue?: number;
  agentCommission: number; // decimal, e.g. 0.07 = 7%
  bankCommission: number;  // decimal
  paymentType: PaymentType;
  renewalType: RenewalType;
  typeCode: TemplateTypeCode;
  loanType: LoanType;
  policyType: PolicyTypeCode;
  quantity: number;        // Sasia
  maxMonths: number;       // Max Muaj
  printType: string;       // Tip Printimi
  cancelled: boolean;      // Anulluar
  isActive: boolean;
  allowedSellerIds: string[]; // who can sell this package
  accountCode: string;      // General ledger account code
};

const seed: Template[] = [
  {
    id: "TPL-3001", productId: "PRD-001", versionId: "VRS-1001",
    name: "ABI i Pjesshem",
    description: "Entry-level package — death cover only at competitive rates.",
    includedCoverageIds: ["COV-2001"],
    optionalRiderIds: [],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
    premiumOverrideType: "Percentage discount",
    premiumOverrideValue: 5,
    agentCommission: 0.07,
    bankCommission: 0.03,
    paymentType: "Payment with regulated premium",
    renewalType: "Automatic annual renewal",
    typeCode: "RP",
    loanType: "Not applicable",
    policyType: "D20V - Up to 20 years",
    quantity: 1,
    maxMonths: 240,
    printType: "9",
    cancelled: false,
    isActive: true,
    allowedSellerIds: ["AGT-001", "AGT-002", "BNK-001"],
    accountCode: "5101",
  },
  {
    id: "TPL-3002", productId: "PRD-001", versionId: "VRS-1001",
    name: "AFB Mortage",
    description: "Balanced cover with disability rider included.",
    includedCoverageIds: ["COV-2001"],
    optionalRiderIds: ["COV-2002", "COV-2003"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR", "USD"],
    premiumOverrideType: "No override",
    agentCommission: 0.08,
    bankCommission: 0.04,
    paymentType: "Payment with regulated premium",
    renewalType: "Automatic annual renewal",
    typeCode: "RP",
    loanType: "Not applicable",
    policyType: "D20V - Up to 20 years",
    quantity: 1,
    maxMonths: 240,
    printType: "9",
    cancelled: false,
    isActive: true,
    allowedSellerIds: ["AGT-001", "AGT-003", "BNK-003", "BNK-004"],
    accountCode: "5102",
  },
  {
    id: "TPL-3003", productId: "PRD-001", versionId: "VRS-1001",
    name: "BKT i Pjesshem me tabele",
    description: "Top-tier package with all riders selectable, premium experience.",
    includedCoverageIds: ["COV-2001", "COV-2002"],
    optionalRiderIds: ["COV-2003", "COV-2004"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR", "USD"],
    premiumOverrideType: "Fixed discount",
    premiumOverrideValue: 25,
    agentCommission: 0.1,
    bankCommission: 0.04,
    paymentType: "Flexible premium payment",
    renewalType: "Manual renewal on request",
    typeCode: "GP",
    loanType: "Not applicable",
    policyType: "WL - Whole life",
    quantity: 1,
    maxMonths: 360,
    printType: "9",
    cancelled: false,
    isActive: true,
    allowedSellerIds: ["AGT-001", "AGT-002", "AGT-003", "AGT-004", "BNK-001", "BNK-002"],
  },
  {
    id: "TPL-3010", productId: "PRD-002", versionId: "VRS-1010",
    name: "Bank Loan Protection",
    description: "Loan protection package distributed via partner banks.",
    includedCoverageIds: ["COV-2020"],
    optionalRiderIds: [],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR", "ALL"],
    premiumOverrideType: "Management approved manual premium",
    agentCommission: 0.05,
    bankCommission: 0.03,
    paymentType: "Bank-financed premium",
    renewalType: "According to the bank information",
    typeCode: "LP",
    loanType: "Mortgage loan",
    policyType: "D10V - Up to 10 years",
    quantity: 1,
    maxMonths: 360,
    printType: "7",
    cancelled: false,
    isActive: true,
    allowedSellerIds: ["BNK-001", "BNK-003", "BNK-005", "BNK-007"],
  },
];

let templates: Template[] = [...seed];

export const listTemplates = (productId: string, versionId?: string) =>
  templates.filter((t) => t.productId === productId && (!versionId || t.versionId === versionId));

export const upsertTemplate = (t: Template) => {
  const i = templates.findIndex((x) => x.id === t.id);
  if (i >= 0) templates[i] = t;
  else templates = [t, ...templates];
};

export const deleteTemplate = (id: string) => {
  templates = templates.filter((t) => t.id !== id);
};

export const newTemplateId = () =>
  `TPL-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;

export const overrideSummary = (t: Template, currency = "EUR") => {
  switch (t.premiumOverrideType) {
    case "No override":
      return "Standard product premium applies.";
    case "Fixed discount":
      return `−${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(t.premiumOverrideValue ?? 0)} off the calculated premium.`;
    case "Percentage discount":
      return `−${(t.premiumOverrideValue ?? 0).toFixed(1)} % off the calculated premium.`;
    case "Fixed premium":
      return `Flat ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(t.premiumOverrideValue ?? 0)} regardless of rate table.`;
    case "Management approved manual premium":
      return "Premium entered manually by underwriter, requires management approval.";
  }
};
