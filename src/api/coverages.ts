import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  CoveragesCoverageResponse,
  CoveragesCreateCoverageRequest,
  CoveragesUpdateCoverageRequest,
  PaginationPagedListOfCoverageResponse,
} from "./types";

export const coveragesKeys = {
  all: [...apiKeys.all, "coverages"] as const,
  lists: () => [...coveragesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...coveragesKeys.lists(), params ?? {}] as const,
  details: () => [...coveragesKeys.all, "detail"] as const,
  detail: (id: string) => [...coveragesKeys.details(), id] as const,
};

/** POST /api/coverages */
export const createCoverage = async (body: CoveragesCreateCoverageRequest, signal?: AbortSignal): Promise<CoveragesCoverageResponse> =>
  apiRequest<CoveragesCoverageResponse>({
    method: "POST",
    path: `/api/coverages`,
    body,
    signal,
  });

export const useCreateCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CoveragesCreateCoverageRequest) => createCoverage(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coveragesKeys.all });
    },
  });
};

/** GET /api/coverages */
export const listCoverages = async (query?: {
  pageNumber?: number;
  pageSize?: number;
}, signal?: AbortSignal): Promise<PaginationPagedListOfCoverageResponse> =>
  apiRequest<PaginationPagedListOfCoverageResponse>({
    method: "GET",
    path: `/api/coverages`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListCoverages = (query?: {
  pageNumber?: number;
  pageSize?: number;
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: coveragesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listCoverages(query, signal),
    enabled: options?.enabled ?? true,
  });

/** DELETE /api/coverages/{id} */
export const deleteCoverage = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/coverages/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoverage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coveragesKeys.all });
    },
  });
};

/** GET /api/coverages/{id} */
export const getCoverage = async (id: string, signal?: AbortSignal): Promise<CoveragesCoverageResponse> =>
  apiRequest<CoveragesCoverageResponse>({
    method: "GET",
    path: `/api/coverages/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetCoverage = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: coveragesKeys.detail(id),
    queryFn: ({ signal }) => getCoverage(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/coverages/{id} */
export const updateCoverage = async (id: string, body: CoveragesUpdateCoverageRequest, signal?: AbortSignal): Promise<CoveragesCoverageResponse> =>
  apiRequest<CoveragesCoverageResponse>({
    method: "PUT",
    path: `/api/coverages/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: CoveragesUpdateCoverageRequest;
    }) =>
      updateCoverage(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coveragesKeys.all });
    },
  });
};
