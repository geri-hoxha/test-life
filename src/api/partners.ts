import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiKeys, apiRequest } from "./client";
import type {
  DomainCommissionsBusinessType,
  PaginationPagedListOfPartnerResponse,
  PartnersCreatePartnerCommissionRuleRequest,
  PartnersCreatePartnerProductAuthorizationRequest,
  PartnersCreatePartnerRequest,
  PartnersListPartnersRequest,
  PartnersPartnerCommissionRuleResponse,
  PartnersPartnerProductAuthorizationResponse,
  PartnersPartnerResponse,
  PartnersUpdatePartnerCommissionRuleRequest,
  PartnersUpdatePartnerProductAuthorizationRequest,
  PartnersUpdatePartnerRequest,
} from "./types";

export const partnersKeys = {
  all: [...apiKeys.all, "partners"] as const,
  lists: () => [...partnersKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...partnersKeys.lists(), params ?? {}] as const,
  details: () => [...partnersKeys.all, "detail"] as const,
  detail: (id: string) => [...partnersKeys.details(), id] as const,
  authorizations: (partnerId: string, params?: Record<string, unknown>) =>
    [...partnersKeys.detail(partnerId), "authorizations", params ?? {}] as const,
  commissionRules: (partnerId: string, authorizationId: string, params?: Record<string, unknown>) =>
    [...partnersKeys.detail(partnerId), "authorizations", authorizationId, "commission-rules", params ?? {}] as const,
};

export type ListPartnersQuery = PartnersListPartnersRequest & {
  pageNumber?: number;
  pageSize?: number;
};

const cachePartner = (
  queryClient: ReturnType<typeof useQueryClient>,
  partner: PartnersPartnerResponse | undefined,
) => {
  if (partner?.id) queryClient.setQueryData(partnersKeys.detail(partner.id), partner);
};

/** GET /api/partners */
export const listPartners = async (
  query?: ListPartnersQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfPartnerResponse> =>
  apiRequest<PaginationPagedListOfPartnerResponse>({
    method: "GET",
    path: `/api/partners`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPartners = (query?: ListPartnersQuery, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: partnersKeys.list(query as Record<string, unknown> | undefined),
    queryFn: async ({ signal }) => {
      const data = await listPartners(query, signal);
      for (const item of data.items ?? []) cachePartner(queryClient, item);
      return data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
};

/**
 * Resolve a partner by id. Swagger only exposes list + update (no GET by id),
 * so this pages through GET /api/partners.
 */
export const getPartner = async (id: string, signal?: AbortSignal): Promise<PartnersPartnerResponse> => {
  let page = 1;
  const pageSize = 100;
  while (page <= 50) {
    const data = await listPartners({ pageNumber: page, pageSize }, signal);
    const found = data.items?.find((partner) => partner.id === id);
    if (found) return found;
    const totalPages = Math.max(1, data.totalPages ?? data.pageCount ?? 1);
    if (!data.hasNextPage && page >= totalPages) break;
    page += 1;
  }
  throw new ApiError(404, "Partner not found", null, {
    title: "Not found",
    detail: "Partner not found",
    status: 404,
  });
};

export const useGetPartner = (id: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: partnersKeys.detail(id),
    queryFn: async ({ signal }) => {
      const cached = queryClient.getQueryData<PartnersPartnerResponse>(partnersKeys.detail(id));
      if (cached?.id === id) return cached;
      const partner = await getPartner(id, signal);
      cachePartner(queryClient, partner);
      return partner;
    },
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

/** POST /api/partners */
export const createPartner = async (
  body: PartnersCreatePartnerRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerResponse> =>
  apiRequest<PartnersPartnerResponse>({
    method: "POST",
    path: `/api/partners`,
    body,
    signal,
  });

export const useCreatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PartnersCreatePartnerRequest) => createPartner(body),
    onSuccess: (data) => {
      cachePartner(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: partnersKeys.all });
    },
  });
};

/** PUT /api/partners/{partnerId} */
export const updatePartner = async (
  partnerId: string,
  body: PartnersUpdatePartnerRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerResponse> =>
  apiRequest<PartnersPartnerResponse>({
    method: "PUT",
    path: `/api/partners/${encodeURIComponent(partnerId)}`,
    body,
    signal,
  });

export const useUpdatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; body: PartnersUpdatePartnerRequest }) =>
      updatePartner(vars.partnerId, vars.body),
    onSuccess: (data) => {
      cachePartner(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: partnersKeys.all });
    },
  });
};

export type ListPartnerProductAuthorizationsQuery = {
  productId?: string;
  partnerOfficeId?: string;
  effectiveOn?: string;
};

/** GET /api/partners/{partnerId}/product-authorizations */
export const listPartnerProductAuthorizations = async (
  partnerId: string,
  query?: ListPartnerProductAuthorizationsQuery,
  signal?: AbortSignal,
): Promise<PartnersPartnerProductAuthorizationResponse[]> =>
  apiRequest<PartnersPartnerProductAuthorizationResponse[]>({
    method: "GET",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPartnerProductAuthorizations = (
  partnerId: string,
  query?: ListPartnerProductAuthorizationsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: partnersKeys.authorizations(partnerId, query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listPartnerProductAuthorizations(partnerId, query, signal),
    enabled: Boolean(partnerId) && (options?.enabled ?? true),
  });

/** POST /api/partners/{partnerId}/product-authorizations */
export const createPartnerProductAuthorization = async (
  partnerId: string,
  body: PartnersCreatePartnerProductAuthorizationRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerProductAuthorizationResponse> =>
  apiRequest<PartnersPartnerProductAuthorizationResponse>({
    method: "POST",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations`,
    body,
    signal,
  });

export const useCreatePartnerProductAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; body: PartnersCreatePartnerProductAuthorizationRequest }) =>
      createPartnerProductAuthorization(vars.partnerId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

/** PUT /api/partners/{partnerId}/product-authorizations/{authorizationId} */
export const updatePartnerProductAuthorization = async (
  partnerId: string,
  authorizationId: string,
  body: PartnersUpdatePartnerProductAuthorizationRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerProductAuthorizationResponse> =>
  apiRequest<PartnersPartnerProductAuthorizationResponse>({
    method: "PUT",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations/${encodeURIComponent(authorizationId)}`,
    body,
    signal,
  });

export const useUpdatePartnerProductAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      partnerId: string;
      authorizationId: string;
      body: PartnersUpdatePartnerProductAuthorizationRequest;
    }) => updatePartnerProductAuthorization(vars.partnerId, vars.authorizationId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

/** DELETE /api/partners/{partnerId}/product-authorizations/{authorizationId} */
export const deletePartnerProductAuthorization = async (
  partnerId: string,
  authorizationId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations/${encodeURIComponent(authorizationId)}`,
    signal,
  });

export const useDeletePartnerProductAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; authorizationId: string }) =>
      deletePartnerProductAuthorization(vars.partnerId, vars.authorizationId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

export type ListPartnerCommissionRulesQuery = {
  businessType?: DomainCommissionsBusinessType;
  effectiveOn?: string;
};

/** GET /api/partners/{partnerId}/product-authorizations/{authorizationId}/commission-rules */
export const listPartnerCommissionRules = async (
  partnerId: string,
  authorizationId: string,
  query?: ListPartnerCommissionRulesQuery,
  signal?: AbortSignal,
): Promise<PartnersPartnerCommissionRuleResponse[]> =>
  apiRequest<PartnersPartnerCommissionRuleResponse[]>({
    method: "GET",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPartnerCommissionRules = (
  partnerId: string,
  authorizationId: string,
  query?: ListPartnerCommissionRulesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: partnersKeys.commissionRules(
      partnerId,
      authorizationId,
      query as Record<string, unknown> | undefined,
    ),
    queryFn: ({ signal }) => listPartnerCommissionRules(partnerId, authorizationId, query, signal),
    enabled: Boolean(partnerId) && Boolean(authorizationId) && (options?.enabled ?? true),
  });

/** POST /api/partners/{partnerId}/product-authorizations/{authorizationId}/commission-rules */
export const createPartnerCommissionRule = async (
  partnerId: string,
  authorizationId: string,
  body: PartnersCreatePartnerCommissionRuleRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerCommissionRuleResponse> =>
  apiRequest<PartnersPartnerCommissionRuleResponse>({
    method: "POST",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules`,
    body,
    signal,
  });

export const useCreatePartnerCommissionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      partnerId: string;
      authorizationId: string;
      body: PartnersCreatePartnerCommissionRuleRequest;
    }) => createPartnerCommissionRule(vars.partnerId, vars.authorizationId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: partnersKeys.detail(vars.partnerId),
      });
    },
  });
};

/** PUT /api/partners/{partnerId}/product-authorizations/{authorizationId}/commission-rules/{ruleId} */
export const updatePartnerCommissionRule = async (
  partnerId: string,
  authorizationId: string,
  ruleId: string,
  body: PartnersUpdatePartnerCommissionRuleRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerCommissionRuleResponse> =>
  apiRequest<PartnersPartnerCommissionRuleResponse>({
    method: "PUT",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules/${encodeURIComponent(ruleId)}`,
    body,
    signal,
  });

export const useUpdatePartnerCommissionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      partnerId: string;
      authorizationId: string;
      ruleId: string;
      body: PartnersUpdatePartnerCommissionRuleRequest;
    }) => updatePartnerCommissionRule(vars.partnerId, vars.authorizationId, vars.ruleId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

/** DELETE /api/partners/{partnerId}/product-authorizations/{authorizationId}/commission-rules/{ruleId} */
export const deletePartnerCommissionRule = async (
  partnerId: string,
  authorizationId: string,
  ruleId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-authorizations/${encodeURIComponent(authorizationId)}/commission-rules/${encodeURIComponent(ruleId)}`,
    signal,
  });

export const useDeletePartnerCommissionRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; authorizationId: string; ruleId: string }) =>
      deletePartnerCommissionRule(vars.partnerId, vars.authorizationId, vars.ruleId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};
