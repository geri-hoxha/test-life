export type ProductStatus = "Draft" | "Active" | "Inactive";

// === Enums mirroring the C# domain ===
export const PRODUCT_GROUPS = [
  { value: "GroupLife", code: "05", label: "Sigurim i Jetes i Kombinuar", english: "Group Life" },
  { value: "CreditLifeRegular", code: "07", label: "Jete e Debitorit Regular", english: "Credit Life Regular" },
  { value: "CreditLifeSingle", code: "08", label: "Jete e Debitorit Single", english: "Credit Life Single" },
  { value: "Protect", code: "09", label: "Sigurimi i Jetes i Kombinuar", english: "Protect" },
  { value: "OnVita", code: "10", label: "Sigurimi i Jetës i Kombinuar", english: "On-Vita" },
  { value: "Endowment", code: "SJ", label: "Sigurim i Jetes me Kursim", english: "Endowment" },
] as const;
export type ProductGroup = typeof PRODUCT_GROUPS[number]["value"] | string;

export type ProductGroupDef = { value: string; code: string; label: string; english: string };

const GROUPS_STORAGE_KEY = "esiglife.productGroups.v1";
const loadCustomGroups = (): ProductGroupDef[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GROUPS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProductGroupDef[]) : [];
  } catch { return []; }
};
let customGroups: ProductGroupDef[] = loadCustomGroups();
const persistGroups = () => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(customGroups)); } catch { /* ignore */ }
};
export const listProductGroups = (): ProductGroupDef[] =>
  [...(PRODUCT_GROUPS as readonly ProductGroupDef[]), ...customGroups];
export const addProductGroup = (g: Omit<ProductGroupDef, "value"> & { value?: string }): ProductGroupDef => {
  const value = g.value?.trim() || `Custom_${g.code}_${Date.now()}`;
  const created: ProductGroupDef = { value, code: g.code, label: g.label, english: g.english };
  customGroups = [...customGroups, created];
  persistGroups();
  return created;
};

export const POLICY_TYPES = [
  { value: "NotApplicable", label: "NA" },
  { value: "UpToOneYear", label: "D1V — Deri në 1 vit" },
  { value: "MaxOneYear", label: "M1V — Max 1 vit" },
  { value: "WithTable", label: "TAB — Me tabelë" },
] as const;

export const INSURANCE_AMOUNT_TYPES = [
  { value: "RemainingPrincipalEachYearWithAmortizationTable", label: "PMVA — Principali i mbetur (me tabelë amortizimi)" },
  { value: "RemainingPrincipalCurrentYearOnly", label: "PMVK — Principali i mbetur (viti korrent)" },
  { value: "InitialLoanAmount", label: "SHFK — Shuma fillestare e kredisë" },
  { value: "VariableInsuranceAmount", label: "SHSN — Shuma e sigurimit e ndryshueshme" },
  { value: "TotalAmount", label: "SHT — Shuma totale" },
  { value: "LoanTopUpAmount", label: "SHTK — Shtesa e kredisë" },
] as const;

export const PREMIUM_PAYMENT_TYPES = [
  { value: "NotApplicable", label: "NA" },
  { value: "CurrentInsuranceYearPremium", label: "PRN — Primi i vitit përkatës" },
  { value: "SinglePremiumForEntirePeriod", label: "PRS — Prim i vetëm" },
  { value: "UpfrontPremium", label: "PUF — Prim up front" },
  { value: "FixedMonthlyPremium", label: "PFM — Prim fiks mujor" },
  { value: "FixedAnnualPremium", label: "PFV — Prim fiks vjetor" },
] as const;

export const PACKET_PAYMENT_TYPES = [
  { value: "NotApplicable", label: "NA" },
  { value: "RegularPremiumPayment", label: "PPR — Pagesa me prim të rregullt" },
  { value: "SinglePremiumForEntirePeriod", label: "PPRS — Prim i vetëm" },
  { value: "PaymentForEntirePeriod", label: "PGP — Pagesë për gjithë periudhën" },
  { value: "FixedMonthlyPremiumPayment", label: "PPFM — Prim fiks mujor" },
  { value: "FixedAnnualPremiumPayment", label: "PPFV — Prim fiks vjetor" },
] as const;

export const PACKET_RENEWAL_TYPES = [
  { value: "NotApplicable", label: "NA" },
  { value: "NotRenewable", label: "NRT — Nuk rinovohet" },
  { value: "AccordingToBankInformation", label: "SIB — Sipas info nga banka" },
  { value: "AccordingToTable", label: "STB — Sipas tabelës" },
] as const;

export const PACKET_LOAN_TYPES = [
  { value: "NotApplicable", label: "NA" },
  { value: "Loan", label: "LP — Loan" },
  { value: "LoanLegacy", label: "Loan (legacy)" },
] as const;

export const LOAN_PRODUCT_TYPES = [
  { value: "NotApplicable", label: "NA" },
  { value: "Loan", label: "Loan" },
  { value: "Mortgage", label: "Mortgage" },
  { value: "Micro", label: "Micro" },
  { value: "Personal", label: "Personal" },
  { value: "PersonalTopUp", label: "Personal top up" },
  { value: "CreditCard", label: "Credit Card" },
  { value: "Overdraft", label: "Overdraft" },
  { value: "Se", label: "SE" },
] as const;

export const ACTUARIAL_CODES = [
  { value: "RegularPersonal", label: "RP — Regular Personal" },
  { value: "RegularTerm", label: "RT — Regular Term" },
  { value: "SingleTerm", label: "ST — Single Term" },
  { value: "SingleTermPpiStandard", label: "STs — PPI Standard" },
  { value: "SingleTermPpiStandardTopUp", label: "STst — PPI Standard Top-Up" },
  { value: "SingleTermPpiExtra", label: "STe — PPI Extra" },
  { value: "SingleTermPpiExtraTopUp", label: "STet — PPI Extra Top-Up" },
  { value: "SingleTermMicro", label: "STmc — Micro" },
  { value: "SingleTermMicroTopUp", label: "STmc-t — Micro Top-Up" },
  { value: "SingleTermMicroExtra", label: "STmc-EX — Micro Extra" },
  { value: "SingleTermMicroStandard", label: "STmc-ST — Micro Standard" },
  { value: "SingleTermMicroSuperior", label: "STmc-SU — Micro Superior" },
  { value: "SingleTermMortgageUpfront", label: "STmu — Mortgage Upfront" },
  { value: "SingleTermSe", label: "STse — SE" },
] as const;

export const BANK_PARTNERS = ["ABI", "FAF", "AFB", "BKT", "CRS", "NA", "ISP", "NOA", "OTP", "PCB", "RBA", "TIB", "UBA", "UFN", "UNI", "TRZ", "SGV", "MIA", "Iut"] as const;

// === Payment behavior models ===
export type PaymentModel =
  | "Standard"
  | "StandardWithScheduleTable"
  | "Upfront"
  | "PpiSinglePremium"
  | "FixedMonthlyPremium"
  | "FixedAnnualPremium";

export const PAYMENT_MODELS: {
  value: PaymentModel;
  label: string;
  description: string;
  defaults: {
    policyType: string;
    insuranceAmountType: string;
    premiumPaymentType: string;
    packetPaymentType: string;
    renewalType: string;
    packetLoanType: string;
    loanProductType: string;
  };
}[] = [
  {
    value: "Standard",
    label: "Standard",
    description: "Multi-year, only current year priced. Renewed manually each year.",
    defaults: {
      policyType: "WithTable",
      insuranceAmountType: "RemainingPrincipalCurrentYearOnly",
      premiumPaymentType: "CurrentInsuranceYearPremium",
      packetPaymentType: "RegularPremiumPayment",
      renewalType: "AccordingToBankInformation",
      packetLoanType: "Loan",
      loanProductType: "Mortgage",
    },
  },
  {
    value: "StandardWithScheduleTable",
    label: "Standard with Schedule Table",
    description: "Multi-year, full schedule generated, annual payments, manual renewal.",
    defaults: {
      policyType: "WithTable",
      insuranceAmountType: "RemainingPrincipalEachYearWithAmortizationTable",
      premiumPaymentType: "CurrentInsuranceYearPremium",
      packetPaymentType: "RegularPremiumPayment",
      renewalType: "AccordingToTable",
      packetLoanType: "Loan",
      loanProductType: "Mortgage",
    },
  },
  {
    value: "Upfront",
    label: "Upfront",
    description: "Multi-year, full schedule paid upfront. No renewal.",
    defaults: {
      policyType: "WithTable",
      insuranceAmountType: "RemainingPrincipalEachYearWithAmortizationTable",
      premiumPaymentType: "UpfrontPremium",
      packetPaymentType: "PaymentForEntirePeriod",
      renewalType: "NotRenewable",
      packetLoanType: "Loan",
      loanProductType: "Mortgage",
    },
  },
  {
    value: "PpiSinglePremium",
    label: "PPI / Single Premium",
    description: "Always 1 installment, 1 policy, no renewal.",
    defaults: {
      policyType: "UpToOneYear",
      insuranceAmountType: "InitialLoanAmount",
      premiumPaymentType: "SinglePremiumForEntirePeriod",
      packetPaymentType: "SinglePremiumForEntirePeriod",
      renewalType: "NotRenewable",
      packetLoanType: "Loan",
      loanProductType: "Personal",
    },
  },
  {
    value: "FixedMonthlyPremium",
    label: "Standard with Schedule — Fixed Monthly Premium",
    description: "Multi-year, equal monthly premiums (annual / 12).",
    defaults: {
      policyType: "WithTable",
      insuranceAmountType: "TotalAmount",
      premiumPaymentType: "FixedMonthlyPremium",
      packetPaymentType: "FixedMonthlyPremiumPayment",
      renewalType: "AccordingToTable",
      packetLoanType: "NotApplicable",
      loanProductType: "NotApplicable",
    },
  },
  {
    value: "FixedAnnualPremium",
    label: "Standard with Schedule — Fixed Annual Premium",
    description: "Multi-year, equal annual premiums (average across term).",
    defaults: {
      policyType: "WithTable",
      insuranceAmountType: "TotalAmount",
      premiumPaymentType: "FixedAnnualPremium",
      packetPaymentType: "FixedAnnualPremiumPayment",
      renewalType: "AccordingToTable",
      packetLoanType: "NotApplicable",
      loanProductType: "NotApplicable",
    },
  },
];

// === Premium tables ===
export type PremiumTableItem = {
  id: string;
  gender: "Male" | "Female" | "Any";
  minAge: number;
  maxAge: number;
  coefficient: number;
};
export type PremiumTable = {
  id: string;
  name: string;
  legacyId: number;
  items: PremiumTableItem[];
};

const seedItems = (base: number): PremiumTableItem[] => [
  { id: "row-1", gender: "Any", minAge: 18, maxAge: 30, coefficient: +(base).toFixed(4) },
  { id: "row-2", gender: "Any", minAge: 31, maxAge: 45, coefficient: +(base * 1.4).toFixed(4) },
  { id: "row-3", gender: "Any", minAge: 46, maxAge: 60, coefficient: +(base * 2.1).toFixed(4) },
  { id: "row-4", gender: "Any", minAge: 61, maxAge: 75, coefficient: +(base * 3.6).toFixed(4) },
];

export const seedPremiumTables: PremiumTable[] = [
  { id: "PT-001", name: "Standard Mortality 2020", legacyId: 1001, items: seedItems(0.0012) },
  { id: "PT-002", name: "Credit Life — Regular", legacyId: 1002, items: seedItems(0.0018) },
  { id: "PT-003", name: "Single Premium PPI", legacyId: 1003, items: seedItems(0.0025) },
  { id: "PT-004", name: "Micro Loan Table", legacyId: 1004, items: seedItems(0.0032) },
];
let premiumTables: PremiumTable[] = [...seedPremiumTables];
export const listPremiumTables = () => premiumTables;
export const getPremiumTable = (id?: string) => premiumTables.find((t) => t.id === id);
export const addPremiumTable = (name: string, legacyId?: number, items?: PremiumTableItem[]): PremiumTable => {
  const maxNum = premiumTables.reduce((m, t) => {
    const n = parseInt(t.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  const t: PremiumTable = {
    id: `PT-${String(maxNum + 1).padStart(3, "0")}`,
    name,
    legacyId: legacyId ?? 1000 + maxNum + 1,
    items: items ?? seedItems(0.0015),
  };
  premiumTables = [...premiumTables, t];
  return t;
};
export const updatePremiumTable = (id: string, patch: Partial<Omit<PremiumTable, "id">>) => {
  premiumTables = premiumTables.map((t) => (t.id === id ? { ...t, ...patch } : t));
  return premiumTables.find((t) => t.id === id);
};

// === Tariffs ===
export type Tariff = {
  id: string;
  productId: string;
  name: string;
  legacyTariffId: number;
  tariffType: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  minPremium: number;
  maxPremium: number;
  fixedPremium: number;
  fixedMonthlyPremium: number;
  fixedAnnualPremium: number;
  formula: string;
  notes: string;
};

let tariffs: Tariff[] = [];
export const listTariffs = (productId?: string) =>
  productId ? tariffs.filter((t) => t.productId === productId) : tariffs;
export const addTariff = (t: Omit<Tariff, "id">): Tariff => {
  const created: Tariff = { ...t, id: `TRF-${Date.now().toString(36)}` };
  tariffs = [...tariffs, created];
  return created;
};
export const updateTariff = (id: string, patch: Partial<Tariff>) => {
  tariffs = tariffs.map((t) => (t.id === id ? { ...t, ...patch } : t));
};
export const removeTariff = (id: string) => {
  tariffs = tariffs.filter((t) => t.id !== id);
};

// === Coverages ===
export type ProductCoverage = {
  id: string;
  productId: string;
  name: string;
  description: string;
  legacyCoverageId: number;
  isMandatory: boolean;
};
let productCoverages: ProductCoverage[] = [];
export const listProductCoverages = (productId?: string) =>
  productId ? productCoverages.filter((c) => c.productId === productId) : productCoverages;
export const addProductCoverage = (c: Omit<ProductCoverage, "id">): ProductCoverage => {
  const created: ProductCoverage = { ...c, id: `COV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}` };
  productCoverages = [...productCoverages, created];
  return created;
};
export const removeProductCoverage = (id: string) => {
  productCoverages = productCoverages.filter((c) => c.id !== id);
};

// === Detail groupings ===
export type ProductSetupDetails = {
  legacyPacketId: number;
  bankPartnerCode: string;
  policyType: string;
  insuranceAmountType: string;
  legacyTariffId: number;
  maxTenorMonths: number;
  isObsolete: boolean;
  apiSubject: boolean;
  apiStraight: boolean;
};
export type ProductPaymentDetails = {
  premiumPaymentType: string;
  packetPaymentType: string;
  renewalType: string;
};
export type ProductLoanDetails = {
  packetLoanType: string;
  loanProductType: string;
};
export type ProductInternalDetails = {
  coveragePrintableText: string;
  packetFinType: number | null;
};
export type ProductExternalDetails = {
  sapProductCode: string;
  sapChannelCode: string;
  f5ProductCode: string;
  actuarialProductCode: string;
};

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
  agentCommission: number;
  bankCommission: number;
  productGroup?: ProductGroup;
  paymentModel?: PaymentModel;
  premiumTableId?: string;
  setupDetails?: ProductSetupDetails;
  paymentDetails?: ProductPaymentDetails;
  loanDetails?: ProductLoanDetails;
  internalDetails?: ProductInternalDetails;
  externalDetails?: ProductExternalDetails;
};

const baseSetup = (overrides: Partial<ProductSetupDetails> = {}): ProductSetupDetails => ({
  legacyPacketId: 0,
  bankPartnerCode: "ISP",
  policyType: "WithTable",
  insuranceAmountType: "TotalAmount",
  legacyTariffId: 0,
  maxTenorMonths: 240,
  isObsolete: false,
  apiSubject: false,
  apiStraight: false,
  ...overrides,
});

type LegacyProductRow = {
  companyId: number;
  packetId: number;
  packetName: string;
  insuranceProductCode: string;
  bankPartnerCode: string;
  premiumPayment: string;
  packetPayment: string;
  packetRenewal: string;
  packetLoan: string;
  loanProduct: string;
  coverageId: number;
  insuranceAmount: string;
  tariffId: number;
  policyType: string;
  maxTenorMonths: number;
  packetActuarCode: string;
  sapProductCode: string;
  sapChannelCode: string;
  packetFinType: number;
  packetObsolete: boolean;
  f5ProductCode: string;
  apiSubject: boolean;
  apiStraight: boolean;
};

const legacyProductRows: LegacyProductRow[] = [
  { companyId: 1, packetId: 1, packetName: "ABI I Pjesshem", insuranceProductCode: "07", bankPartnerCode: "ABI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 7, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 2, packetName: "ABI I Pjesshem me tabele", insuranceProductCode: "07", bankPartnerCode: "ABI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 4, insuranceAmount: "PMVA", tariffId: 7, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 3, packetName: "ABI Standard", insuranceProductCode: "07", bankPartnerCode: "ABI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 5, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 4, packetName: "ABI Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "ABI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 5, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 5, packetName: "FAF Upfront", insuranceProductCode: "07", bankPartnerCode: "FAF", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 1, insuranceAmount: "SHFK", tariffId: 10, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "70420", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 6, packetName: "AFB Mortgage", insuranceProductCode: "07", bankPartnerCode: "AFB", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVK", tariffId: 5, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 7, packetName: "AFB PPI Personal", insuranceProductCode: "08", bankPartnerCode: "AFB", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 2, insuranceAmount: "SHFK", tariffId: 18, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STs", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 11, packetObsolete: false, f5ProductCode: "70414.ALPHA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 8, packetName: "AFB PPI Personal top up", insuranceProductCode: "08", bankPartnerCode: "AFB", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal top up", coverageId: 3, insuranceAmount: "SHT", tariffId: 18, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STst", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 11, packetObsolete: false, f5ProductCode: "70414.ALPHA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 9, packetName: "BKT Standard", insuranceProductCode: "07", bankPartnerCode: "BKT", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 5, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 10, packetName: "BKT Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "BKT", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 33, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 11, packetName: "CRS Standard", insuranceProductCode: "07", bankPartnerCode: "CRS", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 10, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 12, packetName: "CRS Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "CRS", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 10, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 13, packetName: "Group Life Basic", insuranceProductCode: "05", bankPartnerCode: "NA", premiumPayment: "NA", packetPayment: "NA", packetRenewal: "NA", packetLoan: "NA", loanProduct: "NA", coverageId: 12, insuranceAmount: "SHSN", tariffId: 21, policyType: "NA", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "NA", sapChannelCode: "NA", packetFinType: 0, packetObsolete: false, f5ProductCode: "NULL", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 14, packetName: "ISP Standard", insuranceProductCode: "07", bankPartnerCode: "ISP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 4, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 15, packetName: "ISP Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "ISP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 4, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 16, packetName: "NOA Micro", insuranceProductCode: "08", bankPartnerCode: "NOA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 2, insuranceAmount: "SHFK", tariffId: 19, policyType: "M1V", maxTenorMonths: 60, packetActuarCode: "STmc", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 6, packetObsolete: false, f5ProductCode: "70414.NOA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 17, packetName: "NOA Micro top up", insuranceProductCode: "08", bankPartnerCode: "NOA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 2, insuranceAmount: "SHTK", tariffId: 19, policyType: "M1V", maxTenorMonths: 60, packetActuarCode: "STmc-t", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 6, packetObsolete: false, f5ProductCode: "70414.NOA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 18, packetName: "NOA PPI Personal", insuranceProductCode: "08", bankPartnerCode: "NOA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 1, insuranceAmount: "SHFK", tariffId: 19, policyType: "M1V", maxTenorMonths: 60, packetActuarCode: "STs", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 5, packetObsolete: false, f5ProductCode: "70414.NOA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 19, packetName: "NOA PPI Personal top up", insuranceProductCode: "08", bankPartnerCode: "NOA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal top up", coverageId: 1, insuranceAmount: "SHTK", tariffId: 19, policyType: "M1V", maxTenorMonths: 60, packetActuarCode: "STst", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 5, packetObsolete: false, f5ProductCode: "70414.NOA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 20, packetName: "NOA SE", insuranceProductCode: "08", bankPartnerCode: "NOA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "SE", coverageId: 2, insuranceAmount: "SHFK", tariffId: 18, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STse", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 6, packetObsolete: false, f5ProductCode: "70414.NOA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 21, packetName: "OTP Prim Fix Mujor", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PFM", packetPayment: "PPFM", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVA", tariffId: 6, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 8, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 22, packetName: "OTP Prim Fix Vjetor", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PFV", packetPayment: "PPFV", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVA", tariffId: 6, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 8, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 23, packetName: "OTP Upfront", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "Loan", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "SHFK", tariffId: 6, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 8, packetObsolete: false, f5ProductCode: "70416", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 24, packetName: "PCB Standard", insuranceProductCode: "07", bankPartnerCode: "PCB", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVK", tariffId: 8, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 4, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 25, packetName: "Protect Basic", insuranceProductCode: "09", bankPartnerCode: "RBA", premiumPayment: "PFM", packetPayment: "PPFM", packetRenewal: "SIB", packetLoan: "NA", loanProduct: "NA", coverageId: 11, insuranceAmount: "SHSN", tariffId: 20, policyType: "M1V", maxTenorMonths: 444, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL14", packetFinType: 12, packetObsolete: false, f5ProductCode: "7046.RBSJK", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 26, packetName: "Protect Extra", insuranceProductCode: "09", bankPartnerCode: "RBA", premiumPayment: "PFM", packetPayment: "PPFM", packetRenewal: "SIB", packetLoan: "NA", loanProduct: "NA", coverageId: 11, insuranceAmount: "SHSN", tariffId: 21, policyType: "M1V", maxTenorMonths: 444, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL14", packetFinType: 12, packetObsolete: false, f5ProductCode: "7046.RBSJK", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 27, packetName: "Protect Plus", insuranceProductCode: "09", bankPartnerCode: "RBA", premiumPayment: "PFM", packetPayment: "PPFM", packetRenewal: "SIB", packetLoan: "NA", loanProduct: "NA", coverageId: 11, insuranceAmount: "SHSN", tariffId: 22, policyType: "M1V", maxTenorMonths: 444, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL14", packetFinType: 12, packetObsolete: false, f5ProductCode: "7046.RBSJK", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 28, packetName: "RBA PPI Extra", insuranceProductCode: "08", bankPartnerCode: "RBA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 10, insuranceAmount: "SHFK", tariffId: 13, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STe", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 10, packetObsolete: false, f5ProductCode: "70415", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 29, packetName: "RBA PPI Standard top up", insuranceProductCode: "08", bankPartnerCode: "RBA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal top up", coverageId: 7, insuranceAmount: "SHFK", tariffId: 12, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STst", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 10, packetObsolete: false, f5ProductCode: "70414.RB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 30, packetName: "RBA Micro Extra Upfront", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 5, insuranceAmount: "SHFK", tariffId: 16, policyType: "TAB", maxTenorMonths: 120, packetActuarCode: "STmc-EX", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 3, packetObsolete: false, f5ProductCode: "70420.RB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 31, packetName: "RBA Micro Standard Upfront", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 1, insuranceAmount: "SHFK", tariffId: 15, policyType: "TAB", maxTenorMonths: 120, packetActuarCode: "STmc-ST", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 3, packetObsolete: false, f5ProductCode: "70420.RB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 32, packetName: "RBA Micro Super Upfront", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 6, insuranceAmount: "SHFK", tariffId: 17, policyType: "TAB", maxTenorMonths: 120, packetActuarCode: "STmc-SU", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 3, packetObsolete: false, f5ProductCode: "70420.RB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 33, packetName: "RBA Mortgage Standard", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVK", tariffId: 1, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL14", packetFinType: 2, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 34, packetName: "RBA Mortgage Prim Fix", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PFV", packetPayment: "PPFV", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVA", tariffId: 1, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL14", packetFinType: 2, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 35, packetName: "RBA Mortgage Upfront", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "Loan", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "SHFK", tariffId: 1, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "STmu", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 2, packetObsolete: false, f5ProductCode: "70416", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 36, packetName: "RBA PPI Extra top up", insuranceProductCode: "08", bankPartnerCode: "RBA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal top up", coverageId: 9, insuranceAmount: "SHFK", tariffId: 14, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STet", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 10, packetObsolete: false, f5ProductCode: "70415", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 37, packetName: "RBA PPI Standard", insuranceProductCode: "08", bankPartnerCode: "RBA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 8, insuranceAmount: "SHFK", tariffId: 11, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STs", sapProductCode: "S01361", sapChannelCode: "AL14", packetFinType: 10, packetObsolete: false, f5ProductCode: "70414.RB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 38, packetName: "RBA SE", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "SE", coverageId: 1, insuranceAmount: "PMVK", tariffId: 3, policyType: "D1V", maxTenorMonths: 120, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL14", packetFinType: 1, packetObsolete: false, f5ProductCode: "70419", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 39, packetName: "RBA Mortgage MA", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVK", tariffId: 2, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL14", packetFinType: 2, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 40, packetName: "TIB Standard", insuranceProductCode: "07", bankPartnerCode: "TIB", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 9, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 41, packetName: "TIB Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "TIB", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 9, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 42, packetName: "TIB Upfront", insuranceProductCode: "07", bankPartnerCode: "TIB", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "SHFK", tariffId: 9, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "70416", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 43, packetName: "UBA Standard", insuranceProductCode: "07", bankPartnerCode: "UBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 10, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 44, packetName: "UBA Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "UBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 10, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 45, packetName: "UFN Upfront", insuranceProductCode: "07", bankPartnerCode: "UFN", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Micro", coverageId: 1, insuranceAmount: "SHFK", tariffId: 10, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 46, packetName: "UFN Standard", insuranceProductCode: "07", bankPartnerCode: "UFN", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 10, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 47, packetName: "UNI Standard", insuranceProductCode: "07", bankPartnerCode: "UNI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 10, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 48, packetName: "UNI Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "UNI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "Loan", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 10, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 49, packetName: "BKT I Pjesshem me tabele", insuranceProductCode: "07", bankPartnerCode: "BKT", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 4, insuranceAmount: "PMVA", tariffId: 7, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 50, packetName: "OTP Standard", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 6, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 51, packetName: "OTP Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 6, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 52, packetName: "ISP I Pjesshem me tabele", insuranceProductCode: "07", bankPartnerCode: "ISP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 4, insuranceAmount: "PMVA", tariffId: 7, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 53, packetName: "TIB I Pjesshem me tabele", insuranceProductCode: "07", bankPartnerCode: "TIB", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 4, insuranceAmount: "PMVA", tariffId: 7, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 54, packetName: "RBA Mortgage MA 2 i Pjesshem", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 13, insuranceAmount: "PMVK", tariffId: 2, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL14", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 55, packetName: "RBA Mortgage MA i Pjesshem", insuranceProductCode: "07", bankPartnerCode: "RBA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 4, insuranceAmount: "PMVK", tariffId: 7, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL14", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 56, packetName: "UNI I Pjesshem", insuranceProductCode: "07", bankPartnerCode: "UNI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 4, insuranceAmount: "PMVK", tariffId: 7, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 57, packetName: "OTP I Pjesshem me tabele", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 4, insuranceAmount: "PMVA", tariffId: 7, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RP", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 58, packetName: "OTP Mortgage", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVK", tariffId: 5, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 59, packetName: "OTP PPI Personal", insuranceProductCode: "08", bankPartnerCode: "OTP", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 2, insuranceAmount: "SHFK", tariffId: 18, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STs", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 11, packetObsolete: false, f5ProductCode: "70414.OTP", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 60, packetName: "UNI Standard 2024", insuranceProductCode: "07", bankPartnerCode: "UNI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 5, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 15, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 61, packetName: "UNI Standard me tabele 2024", insuranceProductCode: "07", bankPartnerCode: "UNI", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 5, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 13, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 62, packetName: "TRZ Standard me tabele", insuranceProductCode: "07", bankPartnerCode: "TRZ", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 5, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 63, packetName: "TRZ Standard", insuranceProductCode: "07", bankPartnerCode: "TRZ", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 5, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 64, packetName: "OTP B_Mortgage Fix Vjetor", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PFV", packetPayment: "PPFV", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 1, insuranceAmount: "PMVA", tariffId: 6, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 65, packetName: "OTP B_Mortgage Standard", insuranceProductCode: "07", bankPartnerCode: "OTP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVK", tariffId: 6, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 66, packetName: "SGV On-Vita Jete dhe Aksidente Fix", insuranceProductCode: "10", bankPartnerCode: "SGV", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "NA", packetLoan: "NA", loanProduct: "NA", coverageId: 14, insuranceAmount: "SHSN", tariffId: 24, policyType: "D1V", maxTenorMonths: 12, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL23", packetFinType: 15, packetObsolete: false, f5ProductCode: "7046.OVSJKR", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 67, packetName: "BKT On-Vita Standard", insuranceProductCode: "10", bankPartnerCode: "BKT", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NA", packetLoan: "NA", loanProduct: "NA", coverageId: 1, insuranceAmount: "SHSN", tariffId: 5, policyType: "TAB", maxTenorMonths: 60, packetActuarCode: "ST", sapProductCode: "S01351", sapChannelCode: "AL17", packetFinType: 16, packetObsolete: false, f5ProductCode: "7046.BTSJKU", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 68, packetName: "BKT Standard me API", insuranceProductCode: "07", bankPartnerCode: "BKT", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 5, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 69, packetName: "ISP A_Mortgage Standard", insuranceProductCode: "07", bankPartnerCode: "ISP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 15, insuranceAmount: "PMVK", tariffId: 26, policyType: "D1V", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 70, packetName: "ISP A_Mortgage Upfront", insuranceProductCode: "07", bankPartnerCode: "ISP", premiumPayment: "PUF", packetPayment: "PGP", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Mortgage", coverageId: 15, insuranceAmount: "SHFK", tariffId: 26, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "STmu", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "70416.ISP", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 71, packetName: "ISP PPI Konsumatore", insuranceProductCode: "08", bankPartnerCode: "ISP", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 15, insuranceAmount: "SHFK", tariffId: 27, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 20, packetObsolete: false, f5ProductCode: "70414.ISP", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 72, packetName: "ISP PPI Karta e Kreditit", insuranceProductCode: "08", bankPartnerCode: "ISP", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Credit Card", coverageId: 15, insuranceAmount: "SHFK", tariffId: 28, policyType: "M1V", maxTenorMonths: 48, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "70414.ISP", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 73, packetName: "ISP PPI Overdraft", insuranceProductCode: "08", bankPartnerCode: "ISP", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Overdraft", coverageId: 15, insuranceAmount: "SHFK", tariffId: 29, policyType: "M1V", maxTenorMonths: 12, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "70414.ISP", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 74, packetName: "ISP Sigurimi i Jetes i Kombinuar", insuranceProductCode: "10", bankPartnerCode: "ISP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "SIB", packetLoan: "NA", loanProduct: "NA", coverageId: 16, insuranceAmount: "SHSN", tariffId: 31, policyType: "D1V", maxTenorMonths: 12, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "7046.ISPSJKR", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 75, packetName: "OnVita Jete", insuranceProductCode: "10", bankPartnerCode: "NA", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "NA", packetLoan: "NA", loanProduct: "NA", coverageId: 1, insuranceAmount: "SHSN", tariffId: 5, policyType: "D1V", maxTenorMonths: 12, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL01", packetFinType: 16, packetObsolete: false, f5ProductCode: "7046.OVSJKR", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 76, packetName: "BKT Standard me tabele API", insuranceProductCode: "07", bankPartnerCode: "BKT", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 5, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 9, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 77, packetName: "ISP standart me tabele", insuranceProductCode: "07", bankPartnerCode: "ISP", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "STB", packetLoan: "LP", loanProduct: "Loan", coverageId: 1, insuranceAmount: "PMVA", tariffId: 4, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01363", sapChannelCode: "AL17", packetFinType: 7, packetObsolete: false, f5ProductCode: "7041", apiSubject: true, apiStraight: true },
  { companyId: 1, packetId: 78, packetName: "TIB PPI", insuranceProductCode: "08", bankPartnerCode: "TIB", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 2, insuranceAmount: "SHFK", tariffId: 30, policyType: "M1V", maxTenorMonths: 120, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 17, packetObsolete: false, f5ProductCode: "70414.TIB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 79, packetName: "TIB PPI Test_2", insuranceProductCode: "08", bankPartnerCode: "TIB", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 2, insuranceAmount: "SHFK", tariffId: 30, policyType: "M1V", maxTenorMonths: 120, packetActuarCode: "ST", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 17, packetObsolete: false, f5ProductCode: "70414.TIB", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 80, packetName: "SGV-Sot per Neser", insuranceProductCode: "SJ", bankPartnerCode: "SGV", premiumPayment: "PFV", packetPayment: "PPR", packetRenewal: "NRT", packetLoan: "NA", loanProduct: "NA", coverageId: 1, insuranceAmount: "SHSN", tariffId: 30, policyType: "TAB", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL23", packetFinType: 32, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 81, packetName: "SGV-Kasa per Femije", insuranceProductCode: "SJ", bankPartnerCode: "SGV", premiumPayment: "PFV", packetPayment: "PPFV", packetRenewal: "NRT", packetLoan: "NA", loanProduct: "NA", coverageId: 1, insuranceAmount: "SHSN", tariffId: 30, policyType: "NA", maxTenorMonths: 360, packetActuarCode: "RT", sapProductCode: "S01472", sapChannelCode: "AL14", packetFinType: 31, packetObsolete: false, f5ProductCode: "7041", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 82, packetName: "SG On-Vita Jete", insuranceProductCode: "09", bankPartnerCode: "SGV", premiumPayment: "PRN", packetPayment: "PPR", packetRenewal: "NA", packetLoan: "NA", loanProduct: "NA", coverageId: 1, insuranceAmount: "SHSN", tariffId: 24, policyType: "D1V", maxTenorMonths: 12, packetActuarCode: "RT", sapProductCode: "S01353", sapChannelCode: "AL01", packetFinType: 16, packetObsolete: false, f5ProductCode: "7046.OVSJKR", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 83, packetName: "Mia Finance", insuranceProductCode: "08", bankPartnerCode: "MIA", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 2, insuranceAmount: "SHFK", tariffId: 32, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STs", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 100, packetObsolete: false, f5ProductCode: "70414.MIA", apiSubject: false, apiStraight: false },
  { companyId: 1, packetId: 84, packetName: "Iute Credit", insuranceProductCode: "08", bankPartnerCode: "Iut", premiumPayment: "PRS", packetPayment: "PPRS", packetRenewal: "NRT", packetLoan: "LP", loanProduct: "Personal", coverageId: 2, insuranceAmount: "SHFK", tariffId: 32, policyType: "M1V", maxTenorMonths: 84, packetActuarCode: "STs", sapProductCode: "S01361", sapChannelCode: "AL17", packetFinType: 500, packetObsolete: false, f5ProductCode: "70414.IUTE", apiSubject: false, apiStraight: false },
];

const normalizeLegacyString = (value: string) => (value === "NULL" ? "" : value);

const productIdFromPacketId = (packetId: number) => `PRD-${String(packetId).padStart(3, "0")}`;

const productGroupFromCode = (code: string): ProductGroup => {
  switch (code) {
    case "05": return "GroupLife";
    case "07": return "CreditLifeRegular";
    case "08": return "CreditLifeSingle";
    case "09": return "Protect";
    case "10": return "OnVita";
    case "SJ": return "Endowment";
    default: return "CreditLifeRegular";
  }
};

const policyTypeFromCode = (code: string) => {
  switch (code) {
    case "D1V": return "UpToOneYear";
    case "M1V": return "MaxOneYear";
    case "TAB": return "WithTable";
    case "NA":
    default: return "NotApplicable";
  }
};

const insuranceAmountTypeFromCode = (code: string) => {
  switch (code) {
    case "PMVA": return "RemainingPrincipalEachYearWithAmortizationTable";
    case "PMVK": return "RemainingPrincipalCurrentYearOnly";
    case "SHFK": return "InitialLoanAmount";
    case "SHSN": return "VariableInsuranceAmount";
    case "SHT": return "TotalAmount";
    case "SHTK": return "LoanTopUpAmount";
    default: return "TotalAmount";
  }
};

const premiumPaymentTypeFromCode = (code: string) => {
  switch (code) {
    case "PRN": return "CurrentInsuranceYearPremium";
    case "PRS": return "SinglePremiumForEntirePeriod";
    case "PUF": return "UpfrontPremium";
    case "PFM": return "FixedMonthlyPremium";
    case "PFV": return "FixedAnnualPremium";
    case "NA":
    default: return "NotApplicable";
  }
};

const packetPaymentTypeFromCode = (code: string) => {
  switch (code) {
    case "PPR": return "RegularPremiumPayment";
    case "PPRS": return "SinglePremiumForEntirePeriod";
    case "PGP": return "PaymentForEntirePeriod";
    case "PPFM": return "FixedMonthlyPremiumPayment";
    case "PPFV": return "FixedAnnualPremiumPayment";
    case "NA":
    default: return "NotApplicable";
  }
};

const packetRenewalTypeFromCode = (code: string) => {
  switch (code) {
    case "NRT": return "NotRenewable";
    case "SIB": return "AccordingToBankInformation";
    case "STB": return "AccordingToTable";
    case "NA":
    default: return "NotApplicable";
  }
};

const packetLoanTypeFromCode = (code: string) => {
  switch (code) {
    case "LP": return "Loan";
    case "Loan": return "LoanLegacy";
    case "NA":
    default: return "NotApplicable";
  }
};

const loanProductTypeFromCode = (code: string) => {
  switch (code) {
    case "Loan": return "Loan";
    case "Mortgage": return "Mortgage";
    case "Micro": return "Micro";
    case "Personal": return "Personal";
    case "Personal top up": return "PersonalTopUp";
    case "Credit Card": return "CreditCard";
    case "Overdraft": return "Overdraft";
    case "SE": return "Se";
    case "NA":
    default: return "NotApplicable";
  }
};

const actuarialCodeFromCode = (code: string) => {
  switch (code) {
    case "RP": return "RegularPersonal";
    case "RT": return "RegularTerm";
    case "ST": return "SingleTerm";
    case "STs": return "SingleTermPpiStandard";
    case "STst": return "SingleTermPpiStandardTopUp";
    case "STe": return "SingleTermPpiExtra";
    case "STet": return "SingleTermPpiExtraTopUp";
    case "STmc": return "SingleTermMicro";
    case "STmc-t": return "SingleTermMicroTopUp";
    case "STmc-EX": return "SingleTermMicroExtra";
    case "STmc-ST": return "SingleTermMicroStandard";
    case "STmc-SU": return "SingleTermMicroSuperior";
    case "STmu": return "SingleTermMortgageUpfront";
    case "STse": return "SingleTermSe";
    default: return "RegularTerm";
  }
};

const paymentModelFromLegacy = (row: LegacyProductRow): PaymentModel => {
  if (row.premiumPayment === "PFM" || row.packetPayment === "PPFM") return "FixedMonthlyPremium";
  if (row.premiumPayment === "PFV" || row.packetPayment === "PPFV") return "FixedAnnualPremium";
  if (row.premiumPayment === "PUF" || row.packetPayment === "PGP") return "Upfront";
  if (row.premiumPayment === "PRS" || row.packetPayment === "PPRS") return "PpiSinglePremium";
  if (row.policyType === "TAB" || row.packetRenewal === "STB") return "StandardWithScheduleTable";
  return "Standard";
};

const premiumTableIdFromLegacy = (row: LegacyProductRow) => {
  if (row.loanProduct === "Micro" || row.packetActuarCode.startsWith("STmc")) return "PT-004";
  if (row.insuranceProductCode === "08") return "PT-003";
  if (row.insuranceProductCode === "07") return "PT-002";
  return "PT-001";
};

const currenciesFromLegacy = (row: LegacyProductRow) => {
  if (["05", "09", "10", "SJ"].includes(row.insuranceProductCode)) return ["EUR", "ALL", "USD"];
  return ["EUR", "ALL"];
};

const requiredDocumentsFromLegacy = (row: LegacyProductRow) => {
  const documents = ["ID document"];
  if (row.packetLoan !== "NA" || row.loanProduct !== "NA") documents.push("Loan agreement");
  if (["05", "09", "10", "SJ"].includes(row.insuranceProductCode)) documents.push("Medical questionnaire");
  return documents;
};

const descriptionFromLegacy = (row: LegacyProductRow) => {
  const paymentModel = paymentModelFromLegacy(row);
  const productGroup = productGroupFromCode(row.insuranceProductCode);

  if (paymentModel === "Upfront") return `${row.packetName} — upfront premium for the full insured period.`;
  if (paymentModel === "PpiSinglePremium") return `${row.packetName} — single premium product, not renewable.`;
  if (paymentModel === "FixedMonthlyPremium") return `${row.packetName} — fixed monthly premium product.`;
  if (paymentModel === "FixedAnnualPremium") return `${row.packetName} — fixed annual premium product.`;
  if (productGroup === "Protect" || productGroup === "OnVita" || productGroup === "Endowment") return `${row.packetName} — life product configuration imported from legacy LIS.`;
  return `${row.packetName} — regular credit life product configuration imported from legacy LIS.`;
};

const flagsFromLegacy = (row: LegacyProductRow): Product["flags"] => {
  const isSinglePremium = row.premiumPayment === "PRS" || row.packetPayment === "PPRS";
  const isLifeSavingsOrProtection = ["05", "09", "10", "SJ"].includes(row.insuranceProductCode);
  const isMortgage = row.loanProduct === "Mortgage";

  return {
    pep: isLifeSavingsOrProtection || isMortgage,
    highInsuredAmount: isLifeSavingsOrProtection || isMortgage || row.maxTenorMonths > 120,
    totalExposure: !isSinglePremium || isLifeSavingsOrProtection,
    manualUnderwriting: false,
    compliance: true,
  };
};

const agentCommissionFromLegacy = (row: LegacyProductRow) => {
  if (row.insuranceProductCode === "08") return 0.1;
  if (["05", "09", "10", "SJ"].includes(row.insuranceProductCode)) return 0.11;
  return 0.06;
};

const bankCommissionFromLegacy = (row: LegacyProductRow) => {
  if (row.bankPartnerCode === "NA") return 0;
  if (row.premiumPayment === "PUF") return 0.05;
  if (row.insuranceProductCode === "08") return 0.06;
  return 0.04;
};

const coverageTextFromLegacy = (row: LegacyProductRow) =>
  `Legacy COVERAGE_ID ${row.coverageId}. Source packet ${row.packetId} / ${row.packetName}.`;

const productFromLegacy = (row: LegacyProductRow): Product => ({
  id: productIdFromPacketId(row.packetId),
  name: row.packetName,
  code: String(row.packetId),
  status: row.packetObsolete ? "Inactive" : "Active",
  currencies: currenciesFromLegacy(row),
  activeVersion: "v1.0",
  createdDate: "Feb 10, 2024",
  type: "Life Insurance",
  description: descriptionFromLegacy(row),
  requiredDocuments: requiredDocumentsFromLegacy(row),
  flags: flagsFromLegacy(row),
  agentCommission: agentCommissionFromLegacy(row),
  bankCommission: bankCommissionFromLegacy(row),
  productGroup: productGroupFromCode(row.insuranceProductCode),
  paymentModel: paymentModelFromLegacy(row),
  premiumTableId: premiumTableIdFromLegacy(row),
  setupDetails: baseSetup({
    legacyPacketId: row.packetId,
    bankPartnerCode: row.bankPartnerCode,
    policyType: policyTypeFromCode(row.policyType),
    insuranceAmountType: insuranceAmountTypeFromCode(row.insuranceAmount),
    legacyTariffId: row.tariffId,
    maxTenorMonths: row.maxTenorMonths,
    isObsolete: row.packetObsolete,
    apiSubject: row.apiSubject,
    apiStraight: row.apiStraight,
  }),
  paymentDetails: {
    premiumPaymentType: premiumPaymentTypeFromCode(row.premiumPayment),
    packetPaymentType: packetPaymentTypeFromCode(row.packetPayment),
    renewalType: packetRenewalTypeFromCode(row.packetRenewal),
  },
  loanDetails: {
    packetLoanType: packetLoanTypeFromCode(row.packetLoan),
    loanProductType: loanProductTypeFromCode(row.loanProduct),
  },
  internalDetails: {
    coveragePrintableText: coverageTextFromLegacy(row),
    packetFinType: row.packetFinType,
  },
  externalDetails: {
    sapProductCode: normalizeLegacyString(row.sapProductCode),
    sapChannelCode: normalizeLegacyString(row.sapChannelCode),
    f5ProductCode: normalizeLegacyString(row.f5ProductCode),
    actuarialProductCode: actuarialCodeFromCode(row.packetActuarCode),
  },
});

export const seedProducts: Product[] = legacyProductRows.map(productFromLegacy);


// Seed initial tariffs and coverages for all legacy product packets
const seedAuxiliary = () => {
  if (tariffs.length || productCoverages.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const future = "2030-12-31";
  const seedT = (productId: string, name: string, legacyId: number, currency: string, extra: Partial<Tariff> = {}) =>
    addTariff({
      productId, name, legacyTariffId: legacyId, tariffType: "Standard", currency,
      effectiveFrom: today, effectiveTo: future, isActive: true,
      minPremium: 0, maxPremium: 0, fixedPremium: 0, fixedMonthlyPremium: 0, fixedAnnualPremium: 0,
      formula: "premium = coefficient × sum_insured", notes: "Imported from legacy SIG09_PACKET configuration.", ...extra,
    });

  const seedC = (productId: string, name: string, legacyCoverageId: number, mandatory: boolean, desc: string) =>
    addProductCoverage({ productId, name, description: desc, legacyCoverageId, isMandatory: mandatory });

  for (const row of legacyProductRows) {
    const productId = productIdFromPacketId(row.packetId);
    for (const currency of currenciesFromLegacy(row)) {
      seedT(productId, `${row.packetName} ${currency}`, row.tariffId, currency);
    }

    seedC(
      productId,
      `Legacy coverage ${row.coverageId}`,
      row.coverageId,
      true,
      coverageTextFromLegacy(row),
    );
  }
};
seedAuxiliary();


// In-memory store backed by localStorage (demo persistence)
const STORAGE_KEY = "esiglife.products.v5";

const loadProducts = (): Product[] => {
  if (typeof window === "undefined") return [...seedProducts];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...seedProducts];
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) && parsed.length ? parsed : [...seedProducts];
  } catch {
    return [...seedProducts];
  }
};

let products: Product[] = loadProducts();

const persist = () => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); } catch { /* ignore */ }
};

export const resetProducts = () => { products = [...seedProducts]; persist(); };
export const listProducts = () => products;
export const getProduct = (id: string) => products.find((p) => p.id === id);
export const updateProductFlags = (id: string, flags: Product["flags"]) => {
  products = products.map((p) => (p.id === id ? { ...p, flags } : p));
  persist();
  return products.find((p) => p.id === id);
};
export const updateProduct = (id: string, patch: Partial<Omit<Product, "id">>) => {
  products = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
  persist();
  return products.find((p) => p.id === id);
};
export const addProduct = (p: Omit<Product, "id" | "activeVersion" | "createdDate">) => {
  const maxNum = products.reduce((m, x) => {
    const n = parseInt(x.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  const id = `PRD-${String(maxNum + 1).padStart(3, "0")}`;
  const created: Product = {
    ...p, id,
    activeVersion: "v0.1",
    createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  };
  products = [created, ...products];
  persist();
  return created;
};
