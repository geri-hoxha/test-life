import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiKeys, apiRequest } from "./client";
import type {
  AgentsAgentCommissionRuleResponse,
  AgentsAgentProductAuthorizationResponse,
  AgentsAgentResponse,
  AgentsCreateAgentCommissionRuleRequest,
  AgentsCreateAgentProductAuthorizationRequest,
  AgentsCreateAgentRequest,
  AgentsListAgentsRequest,
  AgentsUpdateAgentCommissionRuleRequest,
  AgentsUpdateAgentProductAuthorizationRequest,
  AgentsUpdateAgentRequest,
  DomainCommissionsBusinessType,
  PaginationPagedListOfAgentResponse,
} from "./types";

export const agentsKeys = {
  all: [...apiKeys.all, "agents"] as const,
  lists: () => [...agentsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...agentsKeys.lists(), params ?? {}] as const,
  details: () => [...agentsKeys.all, "detail"] as const,
  detail: (id: string) => [...agentsKeys.details(), id] as const,
  authorizations: (agentId: string, params?: Record<string, unknown>) =>
    [...agentsKeys.detail(agentId), "authorizations", params ?? {}] as const,
  commissionRules: (agentId: string, authorizationId: string, params?: Record<string, unknown>) =>
    [...agentsKeys.detail(agentId), "authorizations", authorizationId, "commission-rules", params ?? {}] as const,
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

export type ListAgentProductAuthorizationsQuery = {
  productId?: string;
  effectiveOn?: string;
};

/** GET /api/agents/{agentId}/product-authorizations */
export const listAgentProductAuthorizations = async (
  agentId: string,
  query?: ListAgentProductAuthorizationsQuery,
  signal?: AbortSignal,
): Promise<AgentsAgentProductAuthorizationResponse[]> =>
  apiRequest<AgentsAgentProductAuthorizationResponse[]>({
    method: "GET",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListAgentProductAuthorizations = (
  agentId: string,
  query?: ListAgentProductAuthorizationsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: agentsKeys.authorizations(agentId, query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listAgentProductAuthorizations(agentId, query, signal),
    enabled: Boolean(agentId) && (options?.enabled ?? true),
  });

/** POST /api/agents/{agentId}/product-authorizations */
export const createAgentProductAuthorization = async (
  agentId: string,
  body: AgentsCreateAgentProductAuthorizationRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentProductAuthorizationResponse> =>
  apiRequest<AgentsAgentProductAuthorizationResponse>({
    method: "POST",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations`,
    body,
    signal,
  });

export const useCreateAgentProductAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agentId: string; body: AgentsCreateAgentProductAuthorizationRequest }) =>
      createAgentProductAuthorization(vars.agentId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};

/** PUT /api/agents/{agentId}/product-authorizations/{authorizationId} */
export const updateAgentProductAuthorization = async (
  agentId: string,
  authorizationId: string,
  body: AgentsUpdateAgentProductAuthorizationRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentProductAuthorizationResponse> =>
  apiRequest<AgentsAgentProductAuthorizationResponse>({
    method: "PUT",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations/${encodeURIComponent(authorizationId)}`,
    body,
    signal,
  });

export const useUpdateAgentProductAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      agentId: string;
      authorizationId: string;
      body: AgentsUpdateAgentProductAuthorizationRequest;
    }) => updateAgentProductAuthorization(vars.agentId, vars.authorizationId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};

/** DELETE /api/agents/{agentId}/product-authorizations/{authorizationId} */
export const deleteAgentProductAuthorization = async (
  agentId: string,
  authorizationId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations/${encodeURIComponent(authorizationId)}`,
    signal,
  });

export const useDeleteAgentProductAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agentId: string; authorizationId: string }) =>
      deleteAgentProductAuthorization(vars.agentId, vars.authorizationId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};

export type ListAgentCommissionRulesQuery = {
  businessType?: DomainCommissionsBusinessType;
  effectiveOn?: string;
};

/** GET /api/agents/{agentId}/product-authorizations/{authorizationId}/commission-rules */
export const listAgentCommissionRules = async (
  agentId: string,
  authorizationId: string,
  query?: ListAgentCommissionRulesQuery,
  signal?: AbortSignal,
): Promise<AgentsAgentCommissionRuleResponse[]> =>
  apiRequest<AgentsAgentCommissionRuleResponse[]>({
    method: "GET",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListAgentCommissionRules = (
  agentId: string,
  authorizationId: string,
  query?: ListAgentCommissionRulesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: agentsKeys.commissionRules(
      agentId,
      authorizationId,
      query as Record<string, unknown> | undefined,
    ),
    queryFn: ({ signal }) => listAgentCommissionRules(agentId, authorizationId, query, signal),
    enabled: Boolean(agentId) && Boolean(authorizationId) && (options?.enabled ?? true),
  });

/** POST /api/agents/{agentId}/product-authorizations/{authorizationId}/commission-rules */
export const createAgentCommissionRule = async (
  agentId: string,
  authorizationId: string,
  body: AgentsCreateAgentCommissionRuleRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentCommissionRuleResponse> =>
  apiRequest<AgentsAgentCommissionRuleResponse>({
    method: "POST",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules`,
    body,
    signal,
  });

export const useCreateAgentCommissionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      agentId: string;
      authorizationId: string;
      body: AgentsCreateAgentCommissionRuleRequest;
    }) => createAgentCommissionRule(vars.agentId, vars.authorizationId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.detail(vars.agentId),
      });
    },
  });
};

/** PUT /api/agents/{agentId}/product-authorizations/{authorizationId}/commission-rules/{ruleId} */
export const updateAgentCommissionRule = async (
  agentId: string,
  authorizationId: string,
  ruleId: string,
  body: AgentsUpdateAgentCommissionRuleRequest,
  signal?: AbortSignal,
): Promise<AgentsAgentCommissionRuleResponse> =>
  apiRequest<AgentsAgentCommissionRuleResponse>({
    method: "PUT",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules/${encodeURIComponent(ruleId)}`,
    body,
    signal,
  });

export const useUpdateAgentCommissionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      agentId: string;
      authorizationId: string;
      ruleId: string;
      body: AgentsUpdateAgentCommissionRuleRequest;
    }) => updateAgentCommissionRule(vars.agentId, vars.authorizationId, vars.ruleId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};

/** DELETE /api/agents/{agentId}/product-authorizations/{authorizationId}/commission-rules/{ruleId} */
export const deleteAgentCommissionRule = async (
  agentId: string,
  authorizationId: string,
  ruleId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/agents/${encodeURIComponent(agentId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules/${encodeURIComponent(ruleId)}`,
    signal,
  });

export const useDeleteAgentCommissionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { agentId: string; authorizationId: string; ruleId: string }) =>
      deleteAgentCommissionRule(vars.agentId, vars.authorizationId, vars.ruleId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.detail(vars.agentId) });
    },
  });
};
