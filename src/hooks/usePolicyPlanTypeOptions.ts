import { useMemo } from "react";
import { usePolicyPlanTypeEnum } from "@/api/smart-enums";
import {
  POLICY_PLAN_TYPE_OPTIONS,
  policyPlanTypeDescription,
  type PolicyPlanTypeOption,
} from "@/data/policy-plan-types";

/**
 * Policy plan types for the product form. Prefers the API smart-enum so labels stay in
 * sync with the backend, falling back to the local table while it loads or if it fails.
 */
export const usePolicyPlanTypeOptions = (): PolicyPlanTypeOption[] => {
  const { data } = usePolicyPlanTypeEnum();

  return useMemo(() => {
    if (!data?.length) return POLICY_PLAN_TYPE_OPTIONS;
    return data.map((item) => ({
      value: item.value as PolicyPlanTypeOption["value"],
      label: item.text || item.value,
      description: policyPlanTypeDescription(item.value) ?? "",
    }));
  }, [data]);
};
