import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  AgentCommissionsAgentCommissionResponse,
  AgentCommissionsGetSummaryRequest,
  AgentCommissionsListAgentCommissionsRequest,
  CommissionsCommissionSummaryResponse,
  PaginationPagedListOfAgentCommissionResponse,
} from "./types";

export const agentCommissionsKeys = {
  all: [...apiKeys.all, "agent-commissions"] as const,
  lists: () => [...agentCommissionsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...agentCommissionsKeys.lists(), params ?? {}] as const,
  details: () => [...agentCommissionsKeys.all, "detail"] as const,
  detail: (id: string) => [...agentCommissionsKeys.details(), id] as const,
  summaries: () => [...agentCommissionsKeys.all, "summary"] as const,
  summary: (params?: Record<string, unknown>) => [...agentCommissionsKeys.summaries(), params ?? {}] as const,
};

export type ListAgentCommissionsQuery = AgentCommissionsListAgentCommissionsRequest & {
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/agent-commissions */
export const listAgentCommissions = async (
  query?: ListAgentCommissionsQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfAgentCommissionResponse> =>
  apiRequest<PaginationPagedListOfAgentCommissionResponse>({
    method: "GET",
    path: `/api/agent-commissions`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListAgentCommissions = (
  query?: ListAgentCommissionsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: agentCommissionsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listAgentCommissions(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** GET /api/agent-commissions/{id} */
export const getAgentCommission = async (
  id: string,
  signal?: AbortSignal,
): Promise<AgentCommissionsAgentCommissionResponse> =>
  apiRequest<AgentCommissionsAgentCommissionResponse>({
    method: "GET",
    path: `/api/agent-commissions/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetAgentCommission = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: agentCommissionsKeys.detail(id),
    queryFn: ({ signal }) => getAgentCommission(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

export type AgentCommissionsSummaryQuery = AgentCommissionsGetSummaryRequest;

/** GET /api/agent-commissions/summary */
export const getAgentCommissionsSummary = async (
  query?: AgentCommissionsSummaryQuery,
  signal?: AbortSignal,
): Promise<CommissionsCommissionSummaryResponse> =>
  apiRequest<CommissionsCommissionSummaryResponse>({
    method: "GET",
    path: `/api/agent-commissions/summary`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useGetAgentCommissionsSummary = (
  query?: AgentCommissionsSummaryQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: agentCommissionsKeys.summary(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => getAgentCommissionsSummary(query, signal),
    enabled: options?.enabled ?? true,
  });
