/**
 * Product/policy classification. Replaces the legacy `premiumPlan` + `sumInsuredBasis` pair.
 *
 * Labels mirror the ones returned by the API's smart-enum endpoint and are used as a
 * fallback when that call has not resolved. PPR-SIB and PPR-STB deliberately share the
 * same API label; `description` is the only thing distinguishing them in the UI.
 */

import type {
  ProductsActuarialCode,
  ProductsBillingCadence,
  ProductsCoveragePeriodCadence,
  ProductsOfferScheduleMode,
  ProductsPolicyContinuationMode,
  ProductsPolicyPlanRules,
  ProductsPolicyPlanType,
  ProductsPremiumCalculationMethod,
} from "@/api/types";

export type PolicyPlanTypeOption = {
  value: ProductsPolicyPlanType;
  label: string;
  description: string;
};

export const POLICY_PLAN_TYPE_OPTIONS: PolicyPlanTypeOption[] = [
  {
    value: "PPR-SIB",
    label: "Pagesa me prim te rregullt",
    description: "Standard — premium recalculated at each renewal, not precomputed",
  },
  {
    value: "PPR-STB",
    label: "Pagesa me prim te rregullt",
    description:
      "Standard with premium table — recalculated per year, whole table priced up front",
  },
  {
    value: "PGP",
    label: "Pagese per gjithe periudhen",
    description: "Upfront — whole term paid as one premium",
  },
  {
    value: "PPRS",
    label: "Pagesa me prim të vetëm për të gjithë periudhën",
    description: "PPI / single premium",
  },
  { value: "PPFM", label: "Pagesa me prim fiks mujor", description: "Fixed monthly" },
  { value: "PPFV", label: "Pagesa me prim fiks vjetor", description: "Fixed annual" },
  { value: "VOLUNTARY", label: "Voluntary", description: "Voluntary life cover" },
  { value: "PROTECT-55", label: "Protect 55", description: "Protect 55 plan" },
];

const OPTION_BY_VALUE = new Map(POLICY_PLAN_TYPE_OPTIONS.map((o) => [o.value, o]));

export const policyPlanTypeLabel = (value?: string | null): string => {
  if (!value) return "—";
  return OPTION_BY_VALUE.get(value as ProductsPolicyPlanType)?.label ?? value;
};

export const policyPlanTypeDescription = (value?: string | null): string | undefined =>
  value ? OPTION_BY_VALUE.get(value as ProductsPolicyPlanType)?.description : undefined;

/** Plans where payPremium is leveled and therefore diverges from the calculated premium. */
export const isLeveledPayPremiumPlan = (value?: string | null): boolean =>
  value === "PPFM" || value === "PPFV";

export const ACTUARIAL_CODES: ProductsActuarialCode[] = [
  "RT",
  "ST",
  "STs",
  "STst",
  "STmc",
  "STmc-t",
  "STse",
  "STe",
  "STmc-EX",
  "STmc-ST",
  "STmc-SU",
  "STmu",
  "STet",
  "RP",
];

export const OFFER_SCHEDULE_LABELS: Record<ProductsOfferScheduleMode, string> = {
  initialPeriodOnly: "Initial period only",
  fullScheduleAtQuote: "Full schedule at quote",
  singleCoveragePeriod: "Single coverage period",
};

export const CONTINUATION_MODE_LABELS: Record<ProductsPolicyContinuationMode, string> = {
  appendCoveragePeriodAtRenewal: "Append period at renewal",
  issueAllPeriodsAtInception: "Issue all periods at inception",
  issueNewPolicyAtRenewal: "Issue new policy at renewal",
};

export const COVERAGE_CADENCE_LABELS: Record<ProductsCoveragePeriodCadence, string> = {
  annual: "Annual",
  monthly: "Monthly",
  wholeTerm: "Whole of term",
};

export const BILLING_CADENCE_LABELS: Record<ProductsBillingCadence, string> = {
  singleAtInception: "Single at inception",
  oncePerCoveragePeriod: "Once per coverage period",
  monthlyWithinCoveragePeriod: "Monthly within coverage period",
};

export const PREMIUM_CALCULATION_LABELS: Record<ProductsPremiumCalculationMethod, string> = {
  declining: "Declining",
  leveled: "Leveled",
  singlePremium: "Single premium",
  nonDecliningProrated: "Non-declining prorated",
  entryAgeFixedMonthly: "Entry-age fixed monthly",
};

export const isWholeOfTermPlan = (rules?: ProductsPolicyPlanRules | null): boolean =>
  rules?.coverageCadence === "wholeTerm" ||
  rules?.continuation === "issueAllPeriodsAtInception";

export const isAnnualRenewablePlan = (rules?: ProductsPolicyPlanRules | null): boolean =>
  rules?.coverageCadence === "annual" ||
  rules?.continuation === "appendCoveragePeriodAtRenewal" ||
  rules?.continuation === "issueNewPolicyAtRenewal";

/** Products that price only the next period; further years appear on renewal. */
export const pricesInitialPeriodOnly = (rules?: ProductsPolicyPlanRules | null): boolean =>
  rules?.offerSchedule === "initialPeriodOnly";

export const formatCoverageTermMonths = (months?: number | null): string => {
  if (months == null) return "—";
  if (months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? "1 year" : `${years} years`;
  }
  return months === 1 ? "1 month" : `${months} months`;
};
