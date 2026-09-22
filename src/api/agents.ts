import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiKeys, apiRequest } from "./client";
import type {
  AgentsAgentProductConfigurationResponse,
  AgentsAgentResponse,
  AgentsCreateAgentProductConfigurationRequest,
  AgentsCreateAgentRequest,
  AgentsListAgentsRequest,
  AgentsUpdateAgentProductConfigurationRequest,
  AgentsUpdateAgentRequest,
  PaginationPagedListOfAgentResponse,
} from "./types";

export const agentsKeys = {
  all: [...apiKeys.all, "agents"] as const,
  lists: () => [...agentsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...agentsKeys.lists(), params ?? {}] as const,
  details: () => [...agentsKeys.all, "detail"] as const,
  detail: (id: string) => [...agentsKeys.details(), id] as const,
  configurations: (agentId: string, params?: Record<string, unknown>) =>
    [...agentsKeys.detail(agentId), "product-configurations", params ?? {}] as const,
};

export type ListAgentsQuery = AgentsListAgentsRequest & {
  pageNumber?: number;
  pageSize?: number;
};

const cacheAgent = (
  queryClient: ReturnType<typeof useQueryClient>,
  agent: AgentsAgentResponse | undefined,
) => {
  if (agent?.id) queryClient.setQueryData(agentsKeys.detail(agent.id), agent);
};

/** GET /api/agents */
export const listAgents = async (
  query?: ListAgentsQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfAgentResponse> =>
  apiRequest<PaginationPagedListOfAgentResponse>({
    method: "GET",
    path: `/api/agents`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListAgents = (query?: ListAgentsQuery, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: agentsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: async ({ signal }) => {
      const data = await listAgents(query, signal);
      for (const item of data.items ?? []) cacheAgent(queryClient, item);
      return data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Resolve an agent by id. Swagger only exposes list + update (no GET by id),
 * so this pages through GET /api/agents.
 */
export const getAgent = async (id: string, signal?: AbortSignal): Promise<AgentsAgentResponse> => {
  let page = 1;
  const pageSize = 100;
  while (page <= 50) {
    const data = await listAgents({ pageNumber: page, pageSize }, signal);
    const found = data.items?.find((agent) => agent.id === id);
    if (found) return found;
    const totalPages = Math.max(1, data.totalPages ?? data.pageCount ?? 1);
    if (!data.hasNextPage && page >= totalPages) break;
    page += 1;
  }
  throw new ApiError(404, "Agent not found", null, {
    title: "Not found",
    detail: "Agent not found",
    status: 404,
  });
};

export const useGetAgent = (id: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: agentsKeys.detail(id),
    queryFn: async ({ signal }) => {
      const cached = queryClient.getQueryData<AgentsAgentResponse>(agentsKeys.detail(id));
      if (cached?.id === id) return cached;
      const agent = await getAgent(id, signal);
      cacheAgent(queryClient, agent);
      return agent;
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/** POST /api/agents */
export const createAgent = async (
  body: AgentsCreateAgentRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentResponse> =>
  apiRequest<AgentsAgentResponse>({
    method: "POST",
    path: `/api/agents`,
    body,
    signal,
  });

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AgentsCreateAgentRequest) => createAgent(body),
    onSuccess: (data) => {
      cacheAgent(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.all });
    },
  });
};

/** PUT /api/agents/{agentId} */
export const updateAgent = async (
  agentId: string,
  body: AgentsUpdateAgentRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentResponse> =>
  apiRequest<AgentsAgentResponse>({
    method: "PUT",
    path: `/api/agents/${encodeURIComponent(agentId)}`,
    body,
    signal,
  });

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agentId: string; body: AgentsUpdateAgentRequest }) =>
      updateAgent(vars.agentId, vars.body),
    onSuccess: (data) => {
      cacheAgent(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.all });
    },
  });
};

export type ListAgentProductConfigurationsQuery = {
  productId?: string;
  effectiveOn?: string;
};

/** GET /api/agents/{agentId}/product-configurations */
export const listAgentProductConfigurations = async (
  agentId: string,
  query?: ListAgentProductConfigurationsQuery,
  signal?: AbortSignal,
): Promise<AgentsAgentProductConfigurationResponse[]> =>
  apiRequest<AgentsAgentProductConfigurationResponse[]>({
    method: "GET",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-configurations`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListAgentProductConfigurations = (
  agentId: string,
  query?: ListAgentProductConfigurationsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: agentsKeys.configurations(agentId, query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listAgentProductConfigurations(agentId, query, signal),
    enabled: Boolean(agentId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });

/** POST /api/agents/{agentId}/product-configurations */
export const createAgentProductConfiguration = async (
  agentId: string,
  body: AgentsCreateAgentProductConfigurationRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentProductConfigurationResponse> =>
  apiRequest<AgentsAgentProductConfigurationResponse>({
    method: "POST",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-configurations`,
    body,
    signal,
  });

export const useCreateAgentProductConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agentId: string; body: AgentsCreateAgentProductConfigurationRequest }) =>
      createAgentProductConfiguration(vars.agentId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};

/** PUT /api/agents/{agentId}/product-configurations/{configurationId} */
export const updateAgentProductConfiguration = async (
  agentId: string,
  configurationId: string,
  body: AgentsUpdateAgentProductConfigurationRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentProductConfigurationResponse> =>
  apiRequest<AgentsAgentProductConfigurationResponse>({
    method: "PUT",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-configurations/${encodeURIComponent(configurationId)}`,
    body,
    signal,
  });

export const useUpdateAgentProductConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      agentId: string;
      configurationId: string;
      body: AgentsUpdateAgentProductConfigurationRequest;
    }) => updateAgentProductConfiguration(vars.agentId, vars.configurationId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};

/** DELETE /api/agents/{agentId}/product-configurations/{configurationId} */
export const deleteAgentProductConfiguration = async (
  agentId: string,
  configurationId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-configurations/${encodeURIComponent(configurationId)}`,
    signal,
  });

export const useDeleteAgentProductConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agentId: string; configurationId: string }) =>
      deleteAgentProductConfiguration(vars.agentId, vars.configurationId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};
