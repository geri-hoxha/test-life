import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  DomainInvoicesInvoiceStatus,
  DomainInvoicesInvoiceType,
  InvoicesInvoiceResponse,
  InvoicesRetryFiscalizationRequest,
  PaginationPagedListOfInvoiceListItemResponse,
} from "./types";

export const invoicesKeys = {
  all: [...apiKeys.all, "invoices"] as const,
  lists: () => [...invoicesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...invoicesKeys.lists(), params ?? {}] as const,
  details: () => [...invoicesKeys.all, "detail"] as const,
  detail: (id: string) => [...invoicesKeys.details(), id] as const,
};

export type ListInvoicesQuery = {
  policyId?: string;
  status?: DomainInvoicesInvoiceStatus;
  type?: DomainInvoicesInvoiceType;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/invoices */
export const listInvoices = async (
  query?: ListInvoicesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfInvoiceListItemResponse> =>
  apiRequest<PaginationPagedListOfInvoiceListItemResponse>({
    method: "GET",
    path: `/api/invoices`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListInvoices = (
  query?: ListInvoicesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: invoicesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listInvoices(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** GET /api/invoices/{id} */
export const getInvoice = async (
  id: string,
  signal?: AbortSignal,
): Promise<InvoicesInvoiceResponse> =>
  apiRequest<InvoicesInvoiceResponse>({
    method: "GET",
    path: `/api/invoices/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetInvoice = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: invoicesKeys.detail(id),
    queryFn: ({ signal }) => getInvoice(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** POST /api/invoices/{id}/fiscalization-retry */
export const retryInvoiceFiscalization = async (
  id: string,
  body: InvoicesRetryFiscalizationRequest,
  signal?: AbortSignal,
): Promise<InvoicesInvoiceResponse> =>
  apiRequest<InvoicesInvoiceResponse>({
    method: "POST",
    path: `/api/invoices/${encodeURIComponent(id)}/fiscalization-retry`,
    body,
    signal,
  });

export const useRetryInvoiceFiscalization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: InvoicesRetryFiscalizationRequest }) =>
      retryInvoiceFiscalization(vars.id, vars.body),
    onSuccess: (data, vars) => {
      if (data?.id) {
        queryClient.setQueryData(invoicesKeys.detail(data.id), data);
      } else {
        queryClient.invalidateQueries({ queryKey: invoicesKeys.detail(vars.id) });
      }
      void queryClient.invalidateQueries({ queryKey: invoicesKeys.lists() });
    },
  });
};
