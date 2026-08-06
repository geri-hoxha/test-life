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
    accountCode: "5103",
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
    accountCode: "5200",
  },
];

let templates: Template[] = [...seed];

export const listTemplates = (productId: string, versionId?: string) =>
  templates.filter((t) => t.productId === productId && (!versionId || t.versionId === versionId));
