import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfPartnerResponse,
  PartnersCreatePartnerOfficeRequest,
  PartnersCreatePartnerProductConfigurationRequest,
  PartnersCreatePartnerRequest,
  PartnersListPartnerOfficesRequest,
  PartnersListPartnerProductConfigurationsRequest,
  PartnersListPartnersRequest,
  PartnersPartnerOfficeResponse,
  PartnersPartnerProductConfigurationResponse,
  PartnersPartnerResponse,
  PartnersUpdatePartnerOfficeRequest,
  PartnersUpdatePartnerProductConfigurationRequest,
  PartnersUpdatePartnerRequest,
} from "./types";

export const partnersKeys = {
  all: [...apiKeys.all, "partners"] as const,
  lists: () => [...partnersKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...partnersKeys.lists(), params ?? {}] as const,
  details: () => [...partnersKeys.all, "detail"] as const,
  detail: (id: string) => [...partnersKeys.details(), id] as const,
  offices: (partnerId: string, params?: Record<string, unknown>) =>
    [...partnersKeys.detail(partnerId), "offices", params ?? {}] as const,
  configurations: (partnerId: string, params?: Record<string, unknown>) =>
    [...partnersKeys.detail(partnerId), "product-configurations", params ?? {}] as const,
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
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      return failureCount < 3;
    },
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
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
        return false;
      }
      return failureCount < 3;
    },
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

export type ListPartnerOfficesQuery = PartnersListPartnerOfficesRequest;

/** GET /api/partners/{partnerId}/offices */
export const listPartnerOffices = async (
  partnerId: string,
  query?: ListPartnerOfficesQuery,
  signal?: AbortSignal,
): Promise<PartnersPartnerOfficeResponse[]> =>
  apiRequest<PartnersPartnerOfficeResponse[]>({
    method: "GET",
    path: `/api/partners/${encodeURIComponent(partnerId)}/offices`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPartnerOffices = (
  partnerId: string,
  query?: ListPartnerOfficesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: partnersKeys.offices(partnerId, query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listPartnerOffices(partnerId, query, signal),
    enabled: Boolean(partnerId) && (options?.enabled ?? true),
  });

/** POST /api/partners/{partnerId}/offices */
export const createPartnerOffice = async (
  partnerId: string,
  body: PartnersCreatePartnerOfficeRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerOfficeResponse> =>
  apiRequest<PartnersPartnerOfficeResponse>({
    method: "POST",
    path: `/api/partners/${encodeURIComponent(partnerId)}/offices`,
    body,
    signal,
  });

export const useCreatePartnerOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; body: PartnersCreatePartnerOfficeRequest }) =>
      createPartnerOffice(vars.partnerId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

/** PUT /api/partners/{partnerId}/offices/{officeId} */
export const updatePartnerOffice = async (
  partnerId: string,
  officeId: string,
  body: PartnersUpdatePartnerOfficeRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerOfficeResponse> =>
  apiRequest<PartnersPartnerOfficeResponse>({
    method: "PUT",
    path: `/api/partners/${encodeURIComponent(partnerId)}/offices/${encodeURIComponent(officeId)}`,
    body,
    signal,
  });

export const useUpdatePartnerOffice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; officeId: string; body: PartnersUpdatePartnerOfficeRequest }) =>
      updatePartnerOffice(vars.partnerId, vars.officeId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

export type ListPartnerProductConfigurationsQuery = PartnersListPartnerProductConfigurationsRequest;

/** GET /api/partners/{partnerId}/product-configurations */
export const listPartnerProductConfigurations = async (
  partnerId: string,
  query?: ListPartnerProductConfigurationsQuery,
  signal?: AbortSignal,
): Promise<PartnersPartnerProductConfigurationResponse[]> =>
  apiRequest<PartnersPartnerProductConfigurationResponse[]>({
    method: "GET",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-configurations`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPartnerProductConfigurations = (
  partnerId: string,
  query?: ListPartnerProductConfigurationsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: partnersKeys.configurations(partnerId, query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listPartnerProductConfigurations(partnerId, query, signal),
    enabled: Boolean(partnerId) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });

/** POST /api/partners/{partnerId}/product-configurations */
export const createPartnerProductConfiguration = async (
  partnerId: string,
  body: PartnersCreatePartnerProductConfigurationRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerProductConfigurationResponse> =>
  apiRequest<PartnersPartnerProductConfigurationResponse>({
    method: "POST",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-configurations`,
    body,
    signal,
  });

export const useCreatePartnerProductConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; body: PartnersCreatePartnerProductConfigurationRequest }) =>
      createPartnerProductConfiguration(vars.partnerId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

/** PUT /api/partners/{partnerId}/product-configurations/{configurationId} */
export const updatePartnerProductConfiguration = async (
  partnerId: string,
  configurationId: string,
  body: PartnersUpdatePartnerProductConfigurationRequest,
  signal?: AbortSignal,
): Promise<PartnersPartnerProductConfigurationResponse> =>
  apiRequest<PartnersPartnerProductConfigurationResponse>({
    method: "PUT",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-configurations/${encodeURIComponent(configurationId)}`,
    body,
    signal,
  });

export const useUpdatePartnerProductConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      partnerId: string;
      configurationId: string;
      body: PartnersUpdatePartnerProductConfigurationRequest;
    }) => updatePartnerProductConfiguration(vars.partnerId, vars.configurationId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};

/** DELETE /api/partners/{partnerId}/product-configurations/{configurationId} */
export const deletePartnerProductConfiguration = async (
  partnerId: string,
  configurationId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/partners/${encodeURIComponent(partnerId)}/product-configurations/${encodeURIComponent(configurationId)}`,
    signal,
  });

export const useDeletePartnerProductConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { partnerId: string; configurationId: string }) =>
      deletePartnerProductConfiguration(vars.partnerId, vars.configurationId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: partnersKeys.detail(vars.partnerId) });
    },
  });
};
