import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import { policiesKeys } from "./policies";
import { invoicesKeys } from "./invoices";
import type {
  DomainPoliciesPolicyRenewalStatus,
  PaginationPagedListOfRenewalListItemResponse,
  PoliciesApplyPolicyRenewalResponse,
  PoliciesListRenewalsRequest,
  PoliciesPolicyRenewalResponse,
  PoliciesRequestRenewalDiscountRequest,
  PoliciesResolveRenewalDocumentRequest,
  PoliciesResolveRenewalFlagRequest,
  PoliciesStartPolicyRenewalRequest,
  PoliciesSubmitRenewalDocumentRequest,
} from "./types";

export const renewalsKeys = {
  all: [...apiKeys.all, "renewals"] as const,
  lists: () => [...renewalsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...renewalsKeys.lists(), params ?? {}] as const,
  details: () => [...renewalsKeys.all, "detail"] as const,
  detail: (policyId: string, renewalId: string) =>
    [...renewalsKeys.details(), policyId, renewalId] as const,
};

export type ListRenewalsQuery = PoliciesListRenewalsRequest & {
  due: boolean;
  pageNumber?: number;
  pageSize?: number;
};

const cacheRenewal = (
  queryClient: ReturnType<typeof useQueryClient>,
  renewal: PoliciesPolicyRenewalResponse | undefined,
) => {
  if (renewal?.id && renewal.policyId) {
    queryClient.setQueryData(renewalsKeys.detail(renewal.policyId, renewal.id), renewal);
  }
};

const invalidateRenewals = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: renewalsKeys.all });
};

/** GET /api/renewals */
export const listRenewals = async (
  query: ListRenewalsQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfRenewalListItemResponse> =>
  apiRequest<PaginationPagedListOfRenewalListItemResponse>({
    method: "GET",
    path: `/api/renewals`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListRenewals = (query: ListRenewalsQuery, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: renewalsKeys.list(query as Record<string, unknown>),
    queryFn: ({ signal }) => listRenewals(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** GET /api/policies/{policyId}/renewals/{renewalId} */
export const getPolicyRenewal = async (
  policyId: string,
  renewalId: string,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "GET",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}`,
    signal,
  });

export const useGetPolicyRenewal = (
  policyId: string,
  renewalId: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: renewalsKeys.detail(policyId, renewalId),
    queryFn: ({ signal }) => getPolicyRenewal(policyId, renewalId, signal),
    enabled: Boolean(policyId) && Boolean(renewalId) && (options?.enabled ?? true),
  });

/** POST /api/policies/{policyId}/renewals/{renewalId}/start */
export const startPolicyRenewal = async (
  policyId: string,
  renewalId: string,
  body: PoliciesStartPolicyRenewalRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/start`,
    body,
    signal,
  });

export const useStartPolicyRenewal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      body: PoliciesStartPolicyRenewalRequest;
    }) => startPolicyRenewal(vars.policyId, vars.renewalId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/pricing */
export const pricePolicyRenewal = async (
  policyId: string,
  renewalId: string,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/pricing`,
    signal,
  });

export const usePricePolicyRenewal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { policyId: string; renewalId: string }) =>
      pricePolicyRenewal(vars.policyId, vars.renewalId),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/application */
export const applyPolicyRenewal = async (
  policyId: string,
  renewalId: string,
  signal?: AbortSignal,
): Promise<PoliciesApplyPolicyRenewalResponse> =>
  apiRequest<PoliciesApplyPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/application`,
    signal,
  });

export const useApplyPolicyRenewal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { policyId: string; renewalId: string }) =>
      applyPolicyRenewal(vars.policyId, vars.renewalId),
    onSuccess: (_data, vars) => {
      invalidateRenewals(queryClient);
      void queryClient.invalidateQueries({ queryKey: policiesKeys.detail(vars.policyId) });
      void queryClient.invalidateQueries({ queryKey: policiesKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: invoicesKeys.lists() });
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/review-flags/{flagId}/approval */
export const approveRenewalFlag = async (
  policyId: string,
  renewalId: string,
  flagId: string,
  body: PoliciesResolveRenewalFlagRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/review-flags/${encodeURIComponent(flagId)}/approval`,
    body,
    signal,
  });

export const useApproveRenewalFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      flagId: string;
      body: PoliciesResolveRenewalFlagRequest;
    }) => approveRenewalFlag(vars.policyId, vars.renewalId, vars.flagId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/review-flags/{flagId}/rejection */
export const rejectRenewalFlag = async (
  policyId: string,
  renewalId: string,
  flagId: string,
  body: PoliciesResolveRenewalFlagRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/review-flags/${encodeURIComponent(flagId)}/rejection`,
    body,
    signal,
  });

export const useRejectRenewalFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      flagId: string;
      body: PoliciesResolveRenewalFlagRequest;
    }) => rejectRenewalFlag(vars.policyId, vars.renewalId, vars.flagId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/documents/{requirementId}/acceptance */
export const acceptRenewalDocument = async (
  policyId: string,
  renewalId: string,
  requirementId: string,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/documents/${encodeURIComponent(requirementId)}/acceptance`,
    signal,
  });

export const useAcceptRenewalDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { policyId: string; renewalId: string; requirementId: string }) =>
      acceptRenewalDocument(vars.policyId, vars.renewalId, vars.requirementId),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/documents/{requirementId}/refusal */
export const refuseRenewalDocument = async (
  policyId: string,
  renewalId: string,
  requirementId: string,
  body: PoliciesResolveRenewalDocumentRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/documents/${encodeURIComponent(requirementId)}/refusal`,
    body,
    signal,
  });

export const useRefuseRenewalDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      requirementId: string;
      body: PoliciesResolveRenewalDocumentRequest;
    }) => refuseRenewalDocument(vars.policyId, vars.renewalId, vars.requirementId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/documents/{requirementId}/submission */
export const submitRenewalDocument = async (
  policyId: string,
  renewalId: string,
  requirementId: string,
  body: PoliciesSubmitRenewalDocumentRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/documents/${encodeURIComponent(requirementId)}/submission`,
    body,
    signal,
  });

export const useSubmitRenewalDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      requirementId: string;
      body: PoliciesSubmitRenewalDocumentRequest;
    }) => submitRenewalDocument(vars.policyId, vars.renewalId, vars.requirementId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/documents/{requirementId}/waiver */
export const waiveRenewalDocument = async (
  policyId: string,
  renewalId: string,
  requirementId: string,
  body: PoliciesResolveRenewalDocumentRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/documents/${encodeURIComponent(requirementId)}/waiver`,
    body,
    signal,
  });

export const useWaiveRenewalDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      requirementId: string;
      body: PoliciesResolveRenewalDocumentRequest;
    }) => waiveRenewalDocument(vars.policyId, vars.renewalId, vars.requirementId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/discount-requests */
export const requestRenewalDiscount = async (
  policyId: string,
  renewalId: string,
  body: PoliciesRequestRenewalDiscountRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/discount-requests`,
    body,
    signal,
  });

export const useRequestRenewalDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      policyId: string;
      renewalId: string;
      body: PoliciesRequestRenewalDiscountRequest;
    }) => requestRenewalDiscount(vars.policyId, vars.renewalId, vars.body),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/discount-requests/{requestId}/approval */
export const approveRenewalDiscount = async (
  policyId: string,
  renewalId: string,
  requestId: string,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/discount-requests/${encodeURIComponent(requestId)}/approval`,
    signal,
  });

export const useApproveRenewalDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { policyId: string; renewalId: string; requestId: string }) =>
      approveRenewalDiscount(vars.policyId, vars.renewalId, vars.requestId),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

/** POST /api/policies/{policyId}/renewals/{renewalId}/discount-requests/{requestId}/rejection */
export const rejectRenewalDiscount = async (
  policyId: string,
  renewalId: string,
  requestId: string,
  signal?: AbortSignal,
): Promise<PoliciesPolicyRenewalResponse> =>
  apiRequest<PoliciesPolicyRenewalResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewals/${encodeURIComponent(renewalId)}/discount-requests/${encodeURIComponent(requestId)}/rejection`,
    signal,
  });

export const useRejectRenewalDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { policyId: string; renewalId: string; requestId: string }) =>
      rejectRenewalDiscount(vars.policyId, vars.renewalId, vars.requestId),
    onSuccess: (data) => {
      cacheRenewal(queryClient, data);
      invalidateRenewals(queryClient);
    },
  });
};

export const isRenewalStatus = (value: string | null): value is DomainPoliciesPolicyRenewalStatus =>
  value === "planned" || value === "draft" || value === "priced" || value === "applied";
