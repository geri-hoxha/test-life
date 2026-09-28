import { useQuery } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type { PolicyPlansPolicyPlanResponse } from "./types";

export const policyPlansKeys = {
  all: [...apiKeys.all, "policy-plans"] as const,
  list: () => [...policyPlansKeys.all, "list"] as const,
};

/** GET /api/policy-plans */
export const listPolicyPlans = async (
  signal?: AbortSignal,
): Promise<PolicyPlansPolicyPlanResponse[]> =>
  apiRequest<PolicyPlansPolicyPlanResponse[]>({
    method: "GET",
    path: `/api/policy-plans`,
    signal,
  });

export const useListPolicyPlans = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: policyPlansKeys.list(),
    queryFn: ({ signal }) => listPolicyPlans(signal),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 60 * 1000,
  });
