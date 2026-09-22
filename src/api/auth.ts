import { useMutation, useQuery } from "@tanstack/react-query";
import { persistSalesAccess, readSalesAccess } from "@/lib/auth";
import { apiKeys, applyAuthSession, apiRequest, clearSession } from "./client";
import type { AuthTokenRequest, AuthTokenResponse, UserSalesAccessResponse } from "./types";

export const salesAccessKeys = {
  mine: () => [...apiKeys.all, "me", "sales-access"] as const,
};

/** POST /api/auth/token */
export const requestToken = async (
  body: AuthTokenRequest,
  signal?: AbortSignal,
): Promise<AuthTokenResponse> =>
  apiRequest<AuthTokenResponse>({
    method: "POST",
    path: "/api/auth/token",
    body,
    skipAuth: true,
    signal,
  });

/** GET /api/me/sales-access — Bearer token is sent by the API client. */
export const getMySalesAccess = async (signal?: AbortSignal): Promise<UserSalesAccessResponse> =>
  apiRequest<UserSalesAccessResponse>({
    method: "GET",
    path: "/api/me/sales-access",
    signal,
  });

/** GET /api/me/sales-access on each full page load. Stored copy is shown until the response arrives. */
export const useMySalesAccess = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: salesAccessKeys.mine(),
    queryFn: async ({ signal }) => {
      const salesAccess = await getMySalesAccess(signal);
      persistSalesAccess(salesAccess);
      return salesAccess;
    },
    enabled: options?.enabled ?? true,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    placeholderData: () => readSalesAccess<UserSalesAccessResponse>() ?? undefined,
  });

export const useRequestToken = () =>
  useMutation({
    mutationFn: async (body: AuthTokenRequest) => {
      const data = await requestToken(body);
      if (!data.accessToken || !data.expiresOnUtc) return data;

      applyAuthSession({
        accessToken: data.accessToken,
        expiresOnUtc: data.expiresOnUtc,
        username: body.username.trim(),
      });

      try {
        const salesAccess = await getMySalesAccess();
        persistSalesAccess(salesAccess);
      } catch (error) {
        clearSession();
        throw error;
      }

      return data;
    },
  });
