import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import { openBlobPrintDialog, openPrintTargetWindow } from "@/lib/print-blob";
import type {
  PaginationPagedListOfPolicyResponse,
  PoliciesPolicyResponse,
} from "./types";

export const policiesKeys = {
  all: [...apiKeys.all, "policies"] as const,
  lists: () => [...policiesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...policiesKeys.lists(), params ?? {}] as const,
  details: () => [...policiesKeys.all, "detail"] as const,
  detail: (id: string) => [...policiesKeys.details(), id] as const,
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

export type ListPoliciesQuery = {
  productId?: string;
  offerId?: string;
  currency?: string;
  issuedFromUtc?: string;
  issuedToUtc?: string;
  effectiveOnUtc?: string;
  partyId?: string;
  personId?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/policies */
export const listPolicies = async (
  query?: ListPoliciesQuery,
  signal?: AbortSignal
): Promise<PaginationPagedListOfPolicyResponse> =>
  apiRequest<PaginationPagedListOfPolicyResponse>({
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
