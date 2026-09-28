import { useMemo } from "react";
import { useListPolicyPlans } from "@/api/policy-plans";
import type { PolicyPlanTypeOption } from "@/data/policy-plan-types";

const EMPTY_OPTIONS: PolicyPlanTypeOption[] = [];

/**
 * Policy plan types for the product form, sourced from the `/api/policy-plans` catalog
 * (Albanian `name`/`description`) so labels and descriptions stay in sync with the backend.
 */
export const usePolicyPlanTypeOptions = (): PolicyPlanTypeOption[] => {
  const { data } = useListPolicyPlans();

  return useMemo(() => {
    if (!data?.length) return EMPTY_OPTIONS;
    return data.map((item) => ({
      value: item.value as PolicyPlanTypeOption["value"],
      label: item.name?.sq || item.text || item.value,
      description: item.description?.sq ?? "",
    }));
  }, [data]);
};

/** Label lookup for stored `PolicyPlanType` values (lists, detail pages). */
export const usePolicyPlanTypeLabel = () => {
  const options = usePolicyPlanTypeOptions();
  return useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value as string, o]));
    return (value?: string | null) => {
      if (!value) return "—";
      return byValue.get(value)?.label ?? value;
    };
  }, [options]);
};

/** Description lookup for stored `PolicyPlanType` values, sourced from the backend catalog. */
export const usePolicyPlanTypeDescription = () => {
  const options = usePolicyPlanTypeOptions();
  return useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value as string, o]));
    return (value?: string | null): string | undefined => {
      if (!value) return undefined;
      return byValue.get(value)?.description || undefined;
    };
  }, [options]);
};
