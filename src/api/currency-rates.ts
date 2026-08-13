import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type { PaginationPagedListOfCurrencyRateResponse } from "./types";

export const currencyRatesKeys = {
  all: [...apiKeys.all, "currency-rates"] as const,
  lists: () => [...currencyRatesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...currencyRatesKeys.lists(), params ?? {}] as const,
};

export type ListCurrencyRatesQuery = {
  latestOnly?: boolean;
  currency?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/currency-rates */
export const listCurrencyRates = async (
  query?: ListCurrencyRatesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfCurrencyRateResponse> =>
  apiRequest<PaginationPagedListOfCurrencyRateResponse>({
    method: "GET",
    path: `/api/currency-rates`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListCurrencyRates = (
  query?: ListCurrencyRatesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: currencyRatesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listCurrencyRates(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
