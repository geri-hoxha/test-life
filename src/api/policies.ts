import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiKeys, apiRequest } from "./client";
import { openBlobPrintDialog, openPrintTargetWindow } from "@/lib/print-blob";
import type {
  OffersOfferResponse,
  PaginationPagedListOfPolicyListItemResponse,
  PoliciesApplyPolicyCancellationResponse,
  PoliciesListPoliciesRequest,
  PoliciesPolicyCancellationRequest,
  PoliciesPolicyCancellationResponse,
  PoliciesPolicyResponse,
  PoliciesPremiumInstallmentResponse,
} from "./types";

export const policiesKeys = {
  all: [...apiKeys.all, "policies"] as const,
  lists: () => [...policiesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...policiesKeys.lists(), params ?? {}] as const,
  details: () => [...policiesKeys.all, "detail"] as const,
  detail: (id: string) => [...policiesKeys.details(), id] as const,
  installments: (id: string) => [...policiesKeys.detail(id), "installments"] as const,
  cancellation: (id: string) => [...policiesKeys.detail(id), "cancellation"] as const,
};

/** GET /api/policies/{id} */
export const getPolicy = async (id: string, signal?: AbortSignal): Promise<PoliciesPolicyResponse> =>
  apiRequest<PoliciesPolicyResponse>({
    method: "GET",
    path: `/api/policies/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetPolicy = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: policiesKeys.detail(id),
    queryFn: ({ signal }) => getPolicy(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

export type ListPoliciesQuery = PoliciesListPoliciesRequest;

/** GET /api/policies */
export const listPolicies = async (
  query?: ListPoliciesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfPolicyListItemResponse> =>
  apiRequest<PaginationPagedListOfPolicyListItemResponse>({
    method: "GET",
    path: `/api/policies`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPolicies = (query?: ListPoliciesQuery, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: policiesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listPolicies(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** GET /api/policies/{policyId}/installments */
export const listPolicyInstallments = async (
  policyId: string,
  signal?: AbortSignal,
): Promise<PoliciesPremiumInstallmentResponse[]> =>
  apiRequest<PoliciesPremiumInstallmentResponse[]>({
    method: "GET",
    path: `/api/policies/${encodeURIComponent(policyId)}/installments`,
    signal,
  });

export const useListPolicyInstallments = (policyId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: policiesKeys.installments(policyId),
    queryFn: ({ signal }) => listPolicyInstallments(policyId, signal),
    enabled: Boolean(policyId) && (options?.enabled ?? true),
  });

/** POST /api/policies/{policyId}/renewal-offer */
export const createPolicyRenewalOffer = async (
  policyId: string,
  signal?: AbortSignal,
): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/renewal-offer`,
    signal,
  });

export const useCreatePolicyRenewalOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => createPolicyRenewalOffer(policyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: policiesKeys.all });
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "offers"] });
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "renewals"] });
    },
  });
};

/** POST /api/policies/{id}/print */
export const getPolicyPrint = async (id: string, signal?: AbortSignal): Promise<Blob> =>
  apiRequest<Blob>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(id)}/print`,
    binary: true,
    signal,
  });

/** Open a blank print tab. Call this in the click handler before any await. */
export const openPolicyPrintWindow = () => openPrintTargetWindow();

/** Open print dialog for POST /api/policies/{id}/print */
export const openPolicyPrint = async (id: string, targetWindow?: Window | null) => {
  const blob = await getPolicyPrint(id);
  const mime = (blob.type || "").toLowerCase().split(";")[0].trim();
  await openBlobPrintDialog(blob, {
    fileName: mime.includes("html") ? "policy.html" : "policy.pdf",
    mimeType: mime || undefined,
    targetWindow,
  });
};

const invalidateAfterCancellation = (queryClient: ReturnType<typeof useQueryClient>, policyId: string) => {
  void queryClient.invalidateQueries({ queryKey: policiesKeys.detail(policyId) });
  void queryClient.invalidateQueries({ queryKey: policiesKeys.installments(policyId) });
  void queryClient.invalidateQueries({ queryKey: policiesKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "invoices"] });
  void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "agent-commissions"] });
  void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "partner-commissions"] });
};

/** GET /api/policies/{policyId}/cancellation — 404 means none exists. */
export const getPolicyCancellation = async (
  policyId: string,
  signal?: AbortSignal,
): Promise<PoliciesPolicyCancellationResponse | null> => {
  try {
    return await apiRequest<PoliciesPolicyCancellationResponse>({
      method: "GET",
      path: `/api/policies/${encodeURIComponent(policyId)}/cancellation`,
      signal,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
};

export const useGetPolicyCancellation = (policyId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: policiesKeys.cancellation(policyId),
    queryFn: ({ signal }) => getPolicyCancellation(policyId, signal),
    enabled: Boolean(policyId) && (options?.enabled ?? true),
  });

/** POST /api/policies/{policyId}/cancellation */
export const createPolicyCancellation = async (
  policyId: string,
  body: PoliciesPolicyCancellationRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyCancellationResponse> =>
  apiRequest<PoliciesPolicyCancellationResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/cancellation`,
    body,
    signal,
  });

export const useCreatePolicyCancellation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      body,
    }: {
      policyId: string;
      body: PoliciesPolicyCancellationRequest;
    }) => createPolicyCancellation(policyId, body),
    onSuccess: (data, { policyId }) => {
      queryClient.setQueryData(policiesKeys.cancellation(policyId), data);
      invalidateAfterCancellation(queryClient, policyId);
    },
  });
};

/** PUT /api/policies/{policyId}/cancellation */
export const updatePolicyCancellation = async (
  policyId: string,
  body: PoliciesPolicyCancellationRequest,
  signal?: AbortSignal,
): Promise<PoliciesPolicyCancellationResponse> =>
  apiRequest<PoliciesPolicyCancellationResponse>({
    method: "PUT",
    path: `/api/policies/${encodeURIComponent(policyId)}/cancellation`,
    body,
    signal,
  });

export const useUpdatePolicyCancellation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      body,
    }: {
      policyId: string;
      body: PoliciesPolicyCancellationRequest;
    }) => updatePolicyCancellation(policyId, body),
    onSuccess: (data, { policyId }) => {
      queryClient.setQueryData(policiesKeys.cancellation(policyId), data);
      invalidateAfterCancellation(queryClient, policyId);
    },
  });
};

/** DELETE /api/policies/{policyId}/cancellation */
export const deletePolicyCancellation = async (
  policyId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/policies/${encodeURIComponent(policyId)}/cancellation`,
    signal,
  });

export const useDeletePolicyCancellation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => deletePolicyCancellation(policyId),
    onSuccess: (_data, policyId) => {
      queryClient.setQueryData(policiesKeys.cancellation(policyId), null);
      invalidateAfterCancellation(queryClient, policyId);
    },
  });
};

/** POST /api/policies/{policyId}/cancellation/application */
export const applyPolicyCancellation = async (
  policyId: string,
  signal?: AbortSignal,
): Promise<PoliciesApplyPolicyCancellationResponse> =>
  apiRequest<PoliciesApplyPolicyCancellationResponse>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/cancellation/application`,
    signal,
  });

export const useApplyPolicyCancellation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => applyPolicyCancellation(policyId),
    onSuccess: (data, policyId) => {
      if (data.cancellation) {
        queryClient.setQueryData(policiesKeys.cancellation(policyId), data.cancellation);
      } else {
        void queryClient.invalidateQueries({ queryKey: policiesKeys.cancellation(policyId) });
      }
      invalidateAfterCancellation(queryClient, policyId);
    },
  });
};

/** POST /api/policies/{policyId}/cancellation/print */
export const getPolicyCancellationPrint = async (
  policyId: string,
  signal?: AbortSignal,
): Promise<Blob> =>
  apiRequest<Blob>({
    method: "POST",
    path: `/api/policies/${encodeURIComponent(policyId)}/cancellation/print`,
    binary: true,
    signal,
  });

export const openPolicyCancellationPrintWindow = () => openPrintTargetWindow();

export const openPolicyCancellationPrint = async (
  policyId: string,
  targetWindow?: Window | null,
) => {
  const blob = await getPolicyCancellationPrint(policyId);
  const mime = (blob.type || "").toLowerCase().split(";")[0].trim();
  await openBlobPrintDialog(blob, {
    fileName: mime.includes("html") ? "policy-cancellation.html" : "policy-cancellation.pdf",
    mimeType: mime || undefined,
    targetWindow,
  });
};
