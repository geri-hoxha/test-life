import { useMutation } from "@tanstack/react-query";
import { applyAuthSession, apiRequest } from "./client";
import type { AuthTokenRequest, AuthTokenResponse } from "./types";

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

export const useRequestToken = () =>
  useMutation({
    mutationFn: (body: AuthTokenRequest) => requestToken(body),
    onSuccess: (data) => {
      if (data.accessToken && data.expiresOnUtc) {
        applyAuthSession({
          accessToken: data.accessToken,
          expiresOnUtc: data.expiresOnUtc,
        });
      }
    },
  });
