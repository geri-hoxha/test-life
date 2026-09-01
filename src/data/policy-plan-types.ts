/**
 * Product/policy classification. Replaces the legacy `premiumPlan` + `sumInsuredBasis` pair.
 *
 * Labels mirror the ones returned by the API's smart-enum endpoint and are used as a
 * fallback when that call has not resolved. PPR-SIB and PPR-STB deliberately share the
 * same API label; `description` is the only thing distinguishing them in the UI.
 */

import type { ProductsPolicyPlanType, ProductsScheduleBasis } from "@/api/types";

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
  { value: "NA", label: "NA", description: "Not loan-linked" },
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

export const SCHEDULE_BASIS_LABELS: Record<ProductsScheduleBasis, string> = {
  tabled: "Tabled",
  perRenewalInfo: "Per renewal",
};

export const SCHEDULE_BASIS_DESCRIPTIONS: Record<ProductsScheduleBasis, string> = {
  tabled: "Every covered year is priced up front.",
  perRenewalInfo: "Only the next year is priced; further years appear on renewal.",
};

export const scheduleBasisLabel = (value?: string | null): string | undefined =>
  value ? (SCHEDULE_BASIS_LABELS[value as ProductsScheduleBasis] ?? value) : undefined;
