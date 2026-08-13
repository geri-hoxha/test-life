import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfRatingTableResponse,
  RatingTablesAddRatingTableRuleRequest,
  RatingTablesCreateRatingTableRequest,
  RatingTablesRatingTableResponse,
  RatingTablesRatingTableRuleResponse,
  RatingTablesUpdateRatingTableRequest,
} from "./types";

export type ListRatingTablesQuery = {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
};

export const ratingTablesKeys = {
  all: [...apiKeys.all, "rating-tables"] as const,
  lists: () => [...ratingTablesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...ratingTablesKeys.lists(), params ?? {}] as const,
  details: () => [...ratingTablesKeys.all, "detail"] as const,
  detail: (id: string) => [...ratingTablesKeys.details(), id] as const,
};

/** POST /api/rating-tables/{ratingTableId}/rules */
export const addRatingTableRule = async (ratingTableId: string, body: RatingTablesAddRatingTableRuleRequest, signal?: AbortSignal): Promise<RatingTablesRatingTableRuleResponse> =>
  apiRequest<RatingTablesRatingTableRuleResponse>({
    method: "POST",
    path: `/api/rating-tables/${encodeURIComponent(ratingTableId)}/rules`,
    body,
    signal,
  });

export const useAddRatingTableRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      ratingTableId: string;
      body: RatingTablesAddRatingTableRuleRequest;
    }) =>
      addRatingTableRule(vars.ratingTableId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingTablesKeys.all });
    },
  });
};

/** POST /api/rating-tables */
export const createRatingTable = async (body: RatingTablesCreateRatingTableRequest, signal?: AbortSignal): Promise<RatingTablesRatingTableResponse> =>
  apiRequest<RatingTablesRatingTableResponse>({
    method: "POST",
    path: `/api/rating-tables`,
    body,
    signal,
  });

export const useCreateRatingTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RatingTablesCreateRatingTableRequest) => createRatingTable(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingTablesKeys.all });
    },
  });
};

/** GET /api/rating-tables */
export const listRatingTables = async (
  query?: ListRatingTablesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfRatingTableResponse> =>
  apiRequest<PaginationPagedListOfRatingTableResponse>({
    method: "GET",
    path: `/api/rating-tables`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListRatingTables = (
  query?: ListRatingTablesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ratingTablesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listRatingTables(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** DELETE /api/rating-tables/{id} */
export const deleteRatingTable = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/rating-tables/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteRatingTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRatingTable(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingTablesKeys.all });
    },
  });
};

/** GET /api/rating-tables/{id} */
export const getRatingTable = async (id: string, signal?: AbortSignal): Promise<RatingTablesRatingTableResponse> =>
  apiRequest<RatingTablesRatingTableResponse>({
    method: "GET",
    path: `/api/rating-tables/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetRatingTable = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ratingTablesKeys.detail(id),
    queryFn: ({ signal }) => getRatingTable(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/rating-tables/{id} */
export const updateRatingTable = async (id: string, body: RatingTablesUpdateRatingTableRequest, signal?: AbortSignal): Promise<RatingTablesRatingTableResponse> =>
  apiRequest<RatingTablesRatingTableResponse>({
    method: "PUT",
    path: `/api/rating-tables/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateRatingTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: RatingTablesUpdateRatingTableRequest;
    }) =>
      updateRatingTable(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingTablesKeys.all });
    },
  });
};

/** DELETE /api/rating-tables/{ratingTableId}/rules/{ruleId} */
export const removeRatingTableRule = async (ratingTableId: string, ruleId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/rating-tables/${encodeURIComponent(ratingTableId)}/rules/${encodeURIComponent(ruleId)}`,
    signal,
  });

export const useRemoveRatingTableRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      ratingTableId: string;
      ruleId: string;
    }) =>
      removeRatingTableRule(vars.ratingTableId, vars.ruleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ratingTablesKeys.all });
    },
  });
};
