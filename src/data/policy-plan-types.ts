/** Product/policy classification. Replaces the legacy `premiumPlan` + `sumInsuredBasis` pair. */

import type {
  ProductsActuarialCode,
  ProductsPolicyContinuationMode,
  ProductsPolicyPlanType,
} from "@/api/types";

export type PolicyPlanTypeOption = {
  value: ProductsPolicyPlanType;
  label: string;
  description: string;
};

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

/**
 * How a policy continues after the current period.
 *
 * `/renewal-offer` is only valid for voluntary cover (`newPolicyOffer`).
 * Standard, standard-tabled, fixed monthly, fixed annual, and Protect append a
 * period through `/api/renewals`. Upfront and single premium issue every
 * period at inception and have no renewal step.
 */
export type PolicyRenewalFlow = "newPolicyOffer" | "appendPeriod" | "issuedAtInception";

const RENEWAL_FLOW_BY_PLAN: Record<ProductsPolicyPlanType, PolicyRenewalFlow> = {
  VOLUNTARY: "newPolicyOffer",
  "PPR-SIB": "appendPeriod",
  "PPR-STB": "appendPeriod",
  PPFM: "appendPeriod",
  PPFV: "appendPeriod",
  PGP: "issuedAtInception",
  PPRS: "issuedAtInception",
  "PROTECT-55": "appendPeriod",
};

const RENEWAL_FLOW_BY_CONTINUATION: Record<ProductsPolicyContinuationMode, PolicyRenewalFlow> = {
  issueNewPolicyAtRenewal: "newPolicyOffer",
  appendCoveragePeriodAtRenewal: "appendPeriod",
  issueAllPeriodsAtInception: "issuedAtInception",
};

export const policyRenewalFlow = (
  plan?: string | null,
  continuation?: ProductsPolicyContinuationMode | null,
): PolicyRenewalFlow | null => {
  if (plan && plan in RENEWAL_FLOW_BY_PLAN) {
    return RENEWAL_FLOW_BY_PLAN[plan as ProductsPolicyPlanType];
  }
  if (continuation && continuation in RENEWAL_FLOW_BY_CONTINUATION) {
    return RENEWAL_FLOW_BY_CONTINUATION[continuation];
  }
  return null;
};

export const formatCoverageTermMonths = (months?: number | null): string => {
  if (months == null) return "—";
  if (months % 12 === 0) {
    const years = months / 12;
    return years === 1 ? "1 year" : `${years} years`;
  }
  return months === 1 ? "1 month" : `${months} months`;
};
