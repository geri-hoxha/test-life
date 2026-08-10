import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.detail(vars.companyId) });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
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
    onSuccess: (data) => {
      if (data.id) {
        queryClient.setQueryData(companiesKeys.detail(data.id), data);
      }
      void queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
    },
  });
};

export type ListCompaniesQuery = {
  registrationNumber?: string;
  countryCode?: string;
  legalName?: string;
  tradeName?: string;
  companyType?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/companies */
export const listCompanies = async (
  query?: ListCompaniesQuery,
  signal?: AbortSignal
): Promise<PaginationPagedListOfCompanyResponse> =>
  apiRequest<PaginationPagedListOfCompanyResponse>({
    method: "GET",
    path: `/api/companies`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListCompanies = (query?: ListCompaniesQuery, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: companiesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listCompanies(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
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
    onSuccess: (data, vars) => {
      // Keep existing addresses if the PUT response omits them.
      queryClient.setQueryData(companiesKeys.detail(vars.id), (prev: CompaniesCompanyResponse | undefined) => ({
        ...prev,
        ...data,
        addresses: data.addresses ?? prev?.addresses,
      }));
      void queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
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
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.detail(vars.companyId) });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
    },
  });
};
