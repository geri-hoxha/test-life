import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  CompaniesAddCompanyAddressRequest,
  CompaniesCompanyAddressResponse,
  CompaniesCompanyResponse,
  CompaniesCreateCompanyRequest,
  CompaniesUpdateCompanyRequest,
  PaginationPagedListOfCompanyResponse,
} from "./types";

export const companiesKeys = {
  all: [...apiKeys.all, "companies"] as const,
  lists: () => [...companiesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...companiesKeys.lists(), params ?? {}] as const,
  details: () => [...companiesKeys.all, "detail"] as const,
  detail: (id: string) => [...companiesKeys.details(), id] as const,
};

/** POST /api/companies/{companyId}/addresses */
export const addCompanyAddress = async (companyId: string, body: CompaniesAddCompanyAddressRequest, signal?: AbortSignal): Promise<CompaniesCompanyAddressResponse> =>
  apiRequest<CompaniesCompanyAddressResponse>({
    method: "POST",
    path: `/api/companies/${encodeURIComponent(companyId)}/addresses`,
    body,
    signal,
  });

export const useAddCompanyAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      companyId: string;
      body: CompaniesAddCompanyAddressRequest;
    }) =>
      addCompanyAddress(vars.companyId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
};

/** POST /api/companies */
export const createCompany = async (body: CompaniesCreateCompanyRequest, signal?: AbortSignal): Promise<CompaniesCompanyResponse> =>
  apiRequest<CompaniesCompanyResponse>({
    method: "POST",
    path: `/api/companies`,
    body,
    signal,
  });

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CompaniesCreateCompanyRequest) => createCompany(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
};

/** GET /api/companies */
export const listCompanies = async (query?: {
  pageNumber?: number;
  pageSize?: number;
}, signal?: AbortSignal): Promise<PaginationPagedListOfCompanyResponse> =>
  apiRequest<PaginationPagedListOfCompanyResponse>({
    method: "GET",
    path: `/api/companies`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListCompanies = (query?: {
  pageNumber?: number;
  pageSize?: number;
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: companiesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listCompanies(query, signal),
    enabled: options?.enabled ?? true,
  });

/** GET /api/companies/{id} */
export const getCompany = async (id: string, signal?: AbortSignal): Promise<CompaniesCompanyResponse> =>
  apiRequest<CompaniesCompanyResponse>({
    method: "GET",
    path: `/api/companies/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetCompany = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: companiesKeys.detail(id),
    queryFn: ({ signal }) => getCompany(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/companies/{id} */
export const updateCompany = async (id: string, body: CompaniesUpdateCompanyRequest, signal?: AbortSignal): Promise<CompaniesCompanyResponse> =>
  apiRequest<CompaniesCompanyResponse>({
    method: "PUT",
    path: `/api/companies/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: CompaniesUpdateCompanyRequest;
    }) =>
      updateCompany(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
};

/** DELETE /api/companies/{companyId}/addresses/{addressEntryId} */
export const removeCompanyAddress = async (companyId: string, addressEntryId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/companies/${encodeURIComponent(companyId)}/addresses/${encodeURIComponent(addressEntryId)}`,
    signal,
  });

export const useRemoveCompanyAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      companyId: string;
      addressEntryId: string;
    }) =>
      removeCompanyAddress(vars.companyId, vars.addressEntryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
};
