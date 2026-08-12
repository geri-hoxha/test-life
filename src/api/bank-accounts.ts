import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  BankAccountsBankAccountResponse,
  BankAccountsCreateBankAccountRequest,
  BankAccountsUpdateBankAccountRequest,
  PaginationPagedListOfBankAccountResponse,
} from "./types";

export const bankAccountsKeys = {
  all: [...apiKeys.all, "bank-accounts"] as const,
  lists: () => [...bankAccountsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...bankAccountsKeys.lists(), params ?? {}] as const,
  details: () => [...bankAccountsKeys.all, "detail"] as const,
  detail: (id: string) => [...bankAccountsKeys.details(), id] as const,
};

/** POST /api/bank-accounts */
export const createBankAccount = async (
  body: BankAccountsCreateBankAccountRequest,
  signal?: AbortSignal,
): Promise<BankAccountsBankAccountResponse> =>
  apiRequest<BankAccountsBankAccountResponse>({
    method: "POST",
    path: `/api/bank-accounts`,
    body,
    signal,
  });

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BankAccountsCreateBankAccountRequest) => createBankAccount(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bankAccountsKeys.all });
    },
  });
};

export type ListBankAccountsQuery = {
  currency?: string;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/bank-accounts */
export const listBankAccounts = async (
  query?: ListBankAccountsQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfBankAccountResponse> =>
  apiRequest<PaginationPagedListOfBankAccountResponse>({
    method: "GET",
    path: `/api/bank-accounts`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListBankAccounts = (
  query?: ListBankAccountsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: bankAccountsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listBankAccounts(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** DELETE /api/bank-accounts/{id} */
export const deleteBankAccount = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/bank-accounts/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBankAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bankAccountsKeys.all });
    },
  });
};

/** GET /api/bank-accounts/{id} */
export const getBankAccount = async (
  id: string,
  signal?: AbortSignal,
): Promise<BankAccountsBankAccountResponse> =>
  apiRequest<BankAccountsBankAccountResponse>({
    method: "GET",
    path: `/api/bank-accounts/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetBankAccount = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: bankAccountsKeys.detail(id),
    queryFn: ({ signal }) => getBankAccount(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/bank-accounts/{id} */
export const updateBankAccount = async (
  id: string,
  body: BankAccountsUpdateBankAccountRequest,
  signal?: AbortSignal,
): Promise<BankAccountsBankAccountResponse> =>
  apiRequest<BankAccountsBankAccountResponse>({
    method: "PUT",
    path: `/api/bank-accounts/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: BankAccountsUpdateBankAccountRequest;
    }) => updateBankAccount(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bankAccountsKeys.all });
    },
  });
};
