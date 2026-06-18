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
export type ProductGroup = typeof PRODUCT_GROUPS[number]["value"];

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

export const BANK_PARTNERS = ["BKT", "OTP", "RBA", "ISP", "ABI", "TEB"] as const;

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

export const seedProducts: Product[] = [
  // === The 6 product families ===
  {
    id: "PRD-001", name: "Sigurim i Jetes i Kombinuar", code: "05", status: "Active",
    currencies: ["EUR", "ALL", "USD"], activeVersion: "v3.2", createdDate: "Jan 12, 2025",
    type: "Life Insurance",
    description: "Sigurim jete me mbulim baze Death dhe mbulime shtese opsionale (aksident, paaftesi, semundje kritike).",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
    agentCommission: 0.1, bankCommission: 0.02, productGroup: "GroupLife", premiumTableId: "PT-001",
  },
  {
    id: "PRD-002", name: "Jete e Debitorit Regular", code: "07", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v2.4", createdDate: "Mar 04, 2025",
    type: "Life Insurance",
    description: "Sigurim jete per debitorin me pagese primi te rregullt — mbulim baze Death, distribuim nepermjet bankave partnere.",
    requiredDocuments: ["ID document", "Loan agreement", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
    agentCommission: 0.08, bankCommission: 0.05, productGroup: "CreditLifeRegular", premiumTableId: "PT-002",
  },
  {
    id: "PRD-003", name: "Jete e Debitorit Single", code: "08", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v2.1", createdDate: "Apr 18, 2025",
    type: "Life Insurance",
    description: "Sigurim jete per debitorin me pagese te vetme upfront per gjithe periudhen — mbulim baze Death.",
    requiredDocuments: ["ID document", "Loan agreement", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
    agentCommission: 0.12, bankCommission: 0.04, productGroup: "CreditLifeSingle", premiumTableId: "PT-003",
  },
  {
    id: "PRD-004", name: "Sigurimi i Jetes i Kombinuar 09", code: "09", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.6", createdDate: "Jun 21, 2025",
    type: "Life Insurance",
    description: "Variant i kombinuar i sigurimit te jetes me mbulim baze Death dhe rider opsionale per aksident dhe paaftesi.",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: false },
    agentCommission: 0.09, bankCommission: 0.03, productGroup: "Protect", premiumTableId: "PT-001",
  },
  {
    id: "PRD-005", name: "Sigurimi i Jetes i Kombinuar 10", code: "10", status: "Active",
    currencies: ["EUR", "ALL", "USD"], activeVersion: "v1.3", createdDate: "Aug 09, 2025",
    type: "Life Insurance",
    description: "Variant i zgjeruar i sigurimit te jetes te kombinuar — mbulim baze Death plus pakete e plote rider-ash opsionale.",
    requiredDocuments: ["ID document", "Medical report"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: true, compliance: true },
    agentCommission: 0.11, bankCommission: 0.04, productGroup: "OnVita", premiumTableId: "PT-001",
  },
  {
    id: "PRD-006", name: "Sigurim i Jetes me Kursim", code: "SJ", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.0", createdDate: "Oct 02, 2025",
    type: "Life Insurance",
    description: "Sigurim jete me komponent kursimi — mbulim baze Death me akumulim kapitali ne maturim dhe rider opsionale.",
    requiredDocuments: ["ID document", "Medical questionnaire", "Proof of income"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: false, manualUnderwriting: true, compliance: true },
    agentCommission: 0.15, bankCommission: 0.06, productGroup: "Endowment", premiumTableId: "PT-001",
  },

  // === Legacy ISP / bank-partner configurations ===
  {
    id: "PRD-069", name: "ISP A_Mortgage Standard 07", code: "69", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.0", createdDate: "Feb 10, 2024",
    type: "Life Insurance",
    description: "Mortgage life — multi-year, only current year priced; manual renewal per year.",
    requiredDocuments: ["ID document", "Loan agreement"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
    agentCommission: 0.06, bankCommission: 0.04,
    productGroup: "CreditLifeRegular", paymentModel: "Standard", premiumTableId: "PT-002",
    setupDetails: baseSetup({ legacyPacketId: 69, legacyTariffId: 690, bankPartnerCode: "ISP", policyType: "WithTable", insuranceAmountType: "RemainingPrincipalCurrentYearOnly", maxTenorMonths: 360 }),
    paymentDetails: { premiumPaymentType: "CurrentInsuranceYearPremium", packetPaymentType: "RegularPremiumPayment", renewalType: "AccordingToBankInformation" },
    loanDetails: { packetLoanType: "Loan", loanProductType: "Mortgage" },
    externalDetails: { sapProductCode: "SAP-69", sapChannelCode: "ISP-RT", f5ProductCode: "F5-69", actuarialProductCode: "RegularTerm" },
    internalDetails: { coveragePrintableText: "Death cover, current year remaining principal.", packetFinType: 1 },
  },
  {
    id: "PRD-070", name: "ISP A_Mortgage Upfront 07", code: "70", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.0", createdDate: "Feb 10, 2024",
    type: "Life Insurance",
    description: "Mortgage life — full schedule paid upfront, no renewal.",
    requiredDocuments: ["ID document", "Loan agreement"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
    agentCommission: 0.06, bankCommission: 0.05,
    productGroup: "CreditLifeRegular", paymentModel: "Upfront", premiumTableId: "PT-002",
    setupDetails: baseSetup({ legacyPacketId: 70, legacyTariffId: 700, bankPartnerCode: "ISP", policyType: "WithTable", insuranceAmountType: "RemainingPrincipalEachYearWithAmortizationTable", maxTenorMonths: 360 }),
    paymentDetails: { premiumPaymentType: "UpfrontPremium", packetPaymentType: "PaymentForEntirePeriod", renewalType: "NotRenewable" },
    loanDetails: { packetLoanType: "Loan", loanProductType: "Mortgage" },
    externalDetails: { sapProductCode: "SAP-70", sapChannelCode: "ISP-UF", f5ProductCode: "F5-70", actuarialProductCode: "SingleTermMortgageUpfront" },
    internalDetails: { coveragePrintableText: "Death cover, upfront premium for entire mortgage term.", packetFinType: 2 },
  },
  {
    id: "PRD-071", name: "ISP PPI Konsumatore 08", code: "71", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.0", createdDate: "Feb 10, 2024",
    type: "Life Insurance",
    description: "PPI consumer loan — 1 installment, 1 policy, no renewal. Reference premium 20 EUR / 2 000 ALL.",
    requiredDocuments: ["ID document", "Loan agreement"],
    flags: { pep: false, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: true },
    agentCommission: 0.1, bankCommission: 0.06,
    productGroup: "CreditLifeSingle", paymentModel: "PpiSinglePremium", premiumTableId: "PT-003",
    setupDetails: baseSetup({ legacyPacketId: 71, legacyTariffId: 710, bankPartnerCode: "ISP", policyType: "UpToOneYear", insuranceAmountType: "InitialLoanAmount", maxTenorMonths: 60 }),
    paymentDetails: { premiumPaymentType: "SinglePremiumForEntirePeriod", packetPaymentType: "SinglePremiumForEntirePeriod", renewalType: "NotRenewable" },
    loanDetails: { packetLoanType: "Loan", loanProductType: "Personal" },
    externalDetails: { sapProductCode: "SAP-71", sapChannelCode: "ISP-PPI-KO", f5ProductCode: "F5-71", actuarialProductCode: "SingleTermPpiStandard" },
    internalDetails: { coveragePrintableText: "PPI single premium, consumer loan.", packetFinType: 3 },
  },
  {
    id: "PRD-072", name: "ISP PPI Karta e Kreditit 08", code: "72", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.0", createdDate: "Feb 10, 2024",
    type: "Life Insurance",
    description: "PPI credit card — 1 installment, 1 policy. Reference premium 15 EUR / 1 500 ALL.",
    requiredDocuments: ["ID document"],
    flags: { pep: false, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: true },
    agentCommission: 0.1, bankCommission: 0.06,
    productGroup: "CreditLifeSingle", paymentModel: "PpiSinglePremium", premiumTableId: "PT-003",
    setupDetails: baseSetup({ legacyPacketId: 72, legacyTariffId: 720, bankPartnerCode: "ISP", policyType: "UpToOneYear", insuranceAmountType: "InitialLoanAmount", maxTenorMonths: 12 }),
    paymentDetails: { premiumPaymentType: "SinglePremiumForEntirePeriod", packetPaymentType: "SinglePremiumForEntirePeriod", renewalType: "NotRenewable" },
    loanDetails: { packetLoanType: "Loan", loanProductType: "CreditCard" },
    externalDetails: { sapProductCode: "SAP-72", sapChannelCode: "ISP-PPI-CC", f5ProductCode: "F5-72", actuarialProductCode: "SingleTermPpiStandard" },
    internalDetails: { coveragePrintableText: "PPI single premium, credit card.", packetFinType: 4 },
  },
  {
    id: "PRD-073", name: "ISP PPI Overdraft 08", code: "73", status: "Active",
    currencies: ["EUR", "ALL"], activeVersion: "v1.0", createdDate: "Feb 10, 2024",
    type: "Life Insurance",
    description: "PPI overdraft — 1 installment, 1 policy. Reference premium 15 EUR / 1 500 ALL.",
    requiredDocuments: ["ID document"],
    flags: { pep: false, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: true },
    agentCommission: 0.1, bankCommission: 0.06,
    productGroup: "CreditLifeSingle", paymentModel: "PpiSinglePremium", premiumTableId: "PT-003",
    setupDetails: baseSetup({ legacyPacketId: 73, legacyTariffId: 730, bankPartnerCode: "ISP", policyType: "UpToOneYear", insuranceAmountType: "InitialLoanAmount", maxTenorMonths: 12 }),
    paymentDetails: { premiumPaymentType: "SinglePremiumForEntirePeriod", packetPaymentType: "SinglePremiumForEntirePeriod", renewalType: "NotRenewable" },
    loanDetails: { packetLoanType: "Loan", loanProductType: "Overdraft" },
    externalDetails: { sapProductCode: "SAP-73", sapChannelCode: "ISP-PPI-OD", f5ProductCode: "F5-73", actuarialProductCode: "SingleTermPpiStandard" },
    internalDetails: { coveragePrintableText: "PPI single premium, overdraft.", packetFinType: 5 },
  },
  {
    id: "PRD-074", name: "ISP Sigurimi i Jetes i Kombinuar 10", code: "74", status: "Active",
    currencies: ["EUR", "ALL", "USD"], activeVersion: "v1.0", createdDate: "Feb 10, 2024",
    type: "Life Insurance",
    description: "Combined life — single installment, distributed through ISP.",
    requiredDocuments: ["ID document", "Medical questionnaire"],
    flags: { pep: true, highInsuredAmount: true, totalExposure: true, manualUnderwriting: false, compliance: true },
    agentCommission: 0.11, bankCommission: 0.04,
    productGroup: "OnVita", paymentModel: "PpiSinglePremium", premiumTableId: "PT-001",
    setupDetails: baseSetup({ legacyPacketId: 74, legacyTariffId: 740, bankPartnerCode: "ISP", policyType: "UpToOneYear", insuranceAmountType: "TotalAmount", maxTenorMonths: 12 }),
    paymentDetails: { premiumPaymentType: "SinglePremiumForEntirePeriod", packetPaymentType: "SinglePremiumForEntirePeriod", renewalType: "NotRenewable" },
    loanDetails: { packetLoanType: "NotApplicable", loanProductType: "NotApplicable" },
    externalDetails: { sapProductCode: "SAP-74", sapChannelCode: "ISP-OV", f5ProductCode: "F5-74", actuarialProductCode: "SingleTerm" },
    internalDetails: { coveragePrintableText: "Combined life, single installment.", packetFinType: 6 },
  },
];

// Seed initial tariffs and coverages for the 6 product families
const seedAuxiliary = () => {
  if (tariffs.length || productCoverages.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const future = "2030-12-31";
  const seedT = (productId: string, name: string, legacyId: number, currency: string, extra: Partial<Tariff> = {}) =>
    addTariff({
      productId, name, legacyTariffId: legacyId, tariffType: "Standard", currency,
      effectiveFrom: today, effectiveTo: future, isActive: true,
      minPremium: 0, maxPremium: 0, fixedPremium: 0, fixedMonthlyPremium: 0, fixedAnnualPremium: 0,
      formula: "premium = coefficient × sum_insured", notes: "", ...extra,
    });
  seedT("PRD-001", "Group Life EUR", 510, "EUR");
  seedT("PRD-002", "Credit Life Regular EUR", 710, "EUR");
  seedT("PRD-003", "Credit Life Single EUR", 810, "EUR");
  seedT("PRD-004", "Protect EUR", 910, "EUR");
  seedT("PRD-005", "On-Vita EUR", 1010, "EUR");
  seedT("PRD-006", "Endowment EUR", 1110, "EUR");

  const seedC = (productId: string, name: string, mandatory = true, desc = "Death benefit cover.") =>
    addProductCoverage({ productId, name, description: desc, legacyCoverageId: Math.floor(Math.random() * 9000 + 1000), isMandatory: mandatory });
  ["PRD-001", "PRD-002", "PRD-003", "PRD-004", "PRD-005", "PRD-006"].forEach((id) => seedC(id, "Death"));
  seedC("PRD-001", "Accident", false, "Optional accidental death rider.");
  seedC("PRD-005", "Critical Illness", false, "Optional critical illness rider.");
  seedC("PRD-006", "Savings maturity benefit", true, "Capital accumulation paid at maturity.");
};
seedAuxiliary();


// In-memory store backed by localStorage (demo persistence)
const STORAGE_KEY = "esiglife.products.v2";

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
