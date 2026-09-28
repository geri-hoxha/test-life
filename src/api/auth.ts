import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { persistSalesAccess } from "@/lib/auth";
import { apiKeys, applyAuthSession, apiRequest, clearSession } from "./client";
import type {
  AuthTokenRequest,
  AuthTokenResponse,
  MeChangePasswordRequest,
  UserSalesAccessResponse,
} from "./types";

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

/**
 * GET /api/me/sales-access on each full page load. `RequireAuth` blocks the app until it resolves.
 * Pass `refetchOnMount: "always"` to refresh the cached access whenever the calling component mounts.
 */
export const useMySalesAccess = (options?: {
  enabled?: boolean;
  refetchOnMount?: boolean | "always";
}) =>
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
    refetchOnMount: options?.refetchOnMount ?? true,
  });

/**
 * PUT /api/me/password — 204 on success, 422 when the current password is wrong.
 * Every token of the user is revoked, including the one used for this call.
 */
export const changeMyPassword = async (
  body: MeChangePasswordRequest,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "PUT",
    path: "/api/me/password",
    body,
    signal,
  });

export const useChangeMyPassword = () =>
  useMutation({
    mutationFn: (body: MeChangePasswordRequest) => changeMyPassword(body),
  });

export const useRequestToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
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
        // Seed the cache so RequireAuth doesn't refetch (and show its loader again) after sign-in.
        queryClient.setQueryData(salesAccessKeys.mine(), salesAccess);
      } catch (error) {
        clearSession();
        throw error;
      }

      return data;
    },
  });
};
