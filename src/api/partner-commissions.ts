import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  CommissionsCommissionSummaryResponse,
  PaginationPagedListOfPartnerCommissionResponse,
  PartnerCommissionsGetSummaryRequest,
  PartnerCommissionsListPartnerCommissionsRequest,
  PartnerCommissionsPartnerCommissionResponse,
} from "./types";

export const partnerCommissionsKeys = {
  all: [...apiKeys.all, "partner-commissions"] as const,
  lists: () => [...partnerCommissionsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...partnerCommissionsKeys.lists(), params ?? {}] as const,
  details: () => [...partnerCommissionsKeys.all, "detail"] as const,
  detail: (id: string) => [...partnerCommissionsKeys.details(), id] as const,
  summaries: () => [...partnerCommissionsKeys.all, "summary"] as const,
  summary: (params?: Record<string, unknown>) => [...partnerCommissionsKeys.summaries(), params ?? {}] as const,
};

export type ListPartnerCommissionsQuery = PartnerCommissionsListPartnerCommissionsRequest & {
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/partner-commissions */
export const listPartnerCommissions = async (
  query?: ListPartnerCommissionsQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfPartnerCommissionResponse> =>
  apiRequest<PaginationPagedListOfPartnerCommissionResponse>({
    method: "GET",
    path: `/api/partner-commissions`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPartnerCommissions = (
  query?: ListPartnerCommissionsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: partnerCommissionsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listPartnerCommissions(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** GET /api/partner-commissions/{id} */
export const getPartnerCommission = async (
  id: string,
  signal?: AbortSignal,
): Promise<PartnerCommissionsPartnerCommissionResponse> =>
  apiRequest<PartnerCommissionsPartnerCommissionResponse>({
    method: "GET",
    path: `/api/partner-commissions/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetPartnerCommission = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: partnerCommissionsKeys.detail(id),
    queryFn: ({ signal }) => getPartnerCommission(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

export type PartnerCommissionsSummaryQuery = PartnerCommissionsGetSummaryRequest;

/** GET /api/partner-commissions/summary */
export const getPartnerCommissionsSummary = async (
  query?: PartnerCommissionsSummaryQuery,
  signal?: AbortSignal,
): Promise<CommissionsCommissionSummaryResponse> =>
  apiRequest<CommissionsCommissionSummaryResponse>({
    method: "GET",
    path: `/api/partner-commissions/summary`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useGetPartnerCommissionsSummary = (
  query?: PartnerCommissionsSummaryQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: partnerCommissionsKeys.summary(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => getPartnerCommissionsSummary(query, signal),
    enabled: options?.enabled ?? true,
  });
