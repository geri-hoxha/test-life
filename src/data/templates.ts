export type PremiumOverrideType =
  | "No override"
  | "Fixed discount"
  | "Percentage discount"
  | "Fixed premium"
  | "Management approved manual premium";

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
  isActive: boolean;
};

const seed: Template[] = [
  {
    id: "TPL-3001", productId: "PRD-001", versionId: "VRS-1001",
    name: "Basic",
    description: "Entry-level package — death cover only at competitive rates.",
    includedCoverageIds: ["COV-2001"],
    optionalRiderIds: [],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR"],
    premiumOverrideType: "Percentage discount",
    premiumOverrideValue: 5,
    commissionOverridePct: 10,
    isActive: true,
  },
  {
    id: "TPL-3002", productId: "PRD-001", versionId: "VRS-1001",
    name: "Standard",
    description: "Balanced cover with disability rider included.",
    includedCoverageIds: ["COV-2001"],
    optionalRiderIds: ["COV-2002", "COV-2003"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR", "USD"],
    premiumOverrideType: "No override",
    commissionOverridePct: 12,
    isActive: true,
  },
  {
    id: "TPL-3003", productId: "PRD-001", versionId: "VRS-1001",
    name: "Premium",
    description: "Top-tier package with all riders selectable, premium experience.",
    includedCoverageIds: ["COV-2001", "COV-2002"],
    optionalRiderIds: ["COV-2003", "COV-2004"],
    defaultCurrency: "EUR",
    allowedCurrencies: ["EUR", "USD"],
    premiumOverrideType: "Fixed discount",
    premiumOverrideValue: 25,
    commissionOverridePct: 14,
    isActive: true,
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
    commissionOverridePct: 8,
    isActive: true,
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
