import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  CurrencyRatesListCurrencyRatesRequest,
  PaginationPagedListOfCurrencyRateResponse,
} from "./types";

export const currencyRatesKeys = {
  all: [...apiKeys.all, "currency-rates"] as const,
  lists: () => [...currencyRatesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...currencyRatesKeys.lists(), params ?? {}] as const,
};

export type ListCurrencyRatesQuery = CurrencyRatesListCurrencyRatesRequest & {
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/currency-rates — always sends `latestOnly=true` unless overridden. */
export const listCurrencyRates = async (
  query?: ListCurrencyRatesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfCurrencyRateResponse> => {
  const { latestOnly = true, ...rest } = query ?? {};
  return apiRequest<PaginationPagedListOfCurrencyRateResponse>({
    method: "GET",
    path: `/api/currency-rates`,
    query: {
      latestOnly,
      ...rest,
    } as Record<string, string | number | boolean | null | undefined>,
    signal,
  });
};

export const useListCurrencyRates = (
  query?: ListCurrencyRatesQuery,
  options?: { enabled?: boolean },
) => {
  const resolved: ListCurrencyRatesQuery = { latestOnly: true, ...query };
  return useQuery({
    queryKey: currencyRatesKeys.list(resolved as Record<string, unknown>),
    queryFn: ({ signal }) => listCurrencyRates(resolved, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};
