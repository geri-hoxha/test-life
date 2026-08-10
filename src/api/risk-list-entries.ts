import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  DomainComplianceRiskListType,
  PaginationPagedListOfRiskListEntryResponse,
  RiskListsAddRiskListEntryRequest,
  RiskListsRiskListEntryResponse,
} from "./types";

export const riskListEntriesKeys = {
  all: [...apiKeys.all, "risk-list-entries"] as const,
  lists: () => [...riskListEntriesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...riskListEntriesKeys.lists(), params ?? {}] as const,
};

/** POST /api/risk-list-entries */
export const createRiskListEntry = async (
  body: RiskListsAddRiskListEntryRequest,
  signal?: AbortSignal,
): Promise<RiskListsRiskListEntryResponse> =>
  apiRequest<RiskListsRiskListEntryResponse>({
    method: "POST",
    path: `/api/risk-list-entries`,
    body,
    signal,
  });

export const useCreateRiskListEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RiskListsAddRiskListEntryRequest) => createRiskListEntry(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: riskListEntriesKeys.lists() });
    },
  });
};

export type ListRiskListEntriesQuery = {
  personalIdentifier?: string;
  listType?: DomainComplianceRiskListType;
  createdFromUtc?: string;
  createdToUtc?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/risk-list-entries */
export const listRiskListEntries = async (
  query?: ListRiskListEntriesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfRiskListEntryResponse> =>
  apiRequest<PaginationPagedListOfRiskListEntryResponse>({
    method: "GET",
    path: `/api/risk-list-entries`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListRiskListEntries = (
  query?: ListRiskListEntriesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: riskListEntriesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listRiskListEntries(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** DELETE /api/risk-list-entries/{id} */
export const deleteRiskListEntry = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/risk-list-entries/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteRiskListEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRiskListEntry(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: riskListEntriesKeys.lists() });
    },
  });
};
