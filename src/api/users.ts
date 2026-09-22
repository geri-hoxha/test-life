import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfUserResponse,
  UserSalesAccessResponse,
  UsersCreateUserRequest,
  UsersListUsersRequest,
  UsersUpdateUserRequest,
  UsersUserResponse,
} from "./types";

export const usersKeys = {
  all: [...apiKeys.all, "users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...usersKeys.lists(), params ?? {}] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (authUserId: number) => [...usersKeys.details(), authUserId] as const,
  salesAccess: (authUserId: number) => [...usersKeys.all, "sales-access", authUserId] as const,
};

export type ListUsersQuery = UsersListUsersRequest & {
  pageNumber?: number;
  pageSize?: number;
};

const cacheUser = (
  queryClient: ReturnType<typeof useQueryClient>,
  user: UsersUserResponse | undefined,
) => {
  if (user?.id != null) queryClient.setQueryData(usersKeys.detail(user.id), user);
};

const cacheSalesAccess = (
  queryClient: ReturnType<typeof useQueryClient>,
  access: UserSalesAccessResponse | undefined,
) => {
  if (access?.authUserId != null) {
    queryClient.setQueryData(usersKeys.salesAccess(access.authUserId), access);
  }
};

const retryUnlessAuth = (failureCount: number, error: unknown, extra: number[] = []) => {
  if (error instanceof ApiError && [401, 403, ...extra].includes(error.status)) return false;
  return failureCount < 3;
};

/** GET /api/users */
export const listUsers = async (
  query?: ListUsersQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfUserResponse> =>
  apiRequest<PaginationPagedListOfUserResponse>({
    method: "GET",
    path: "/api/users",
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListUsers = (query?: ListUsersQuery, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: usersKeys.list(query as Record<string, unknown> | undefined),
    queryFn: async ({ signal }) => {
      const data = await listUsers(query, signal);
      for (const item of data.items ?? []) cacheUser(queryClient, item);
      return data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => retryUnlessAuth(failureCount, error),
  });
};

/**
 * Resolve a user by auth id. Swagger only exposes the paged list (no GET by id),
 * so this pages through GET /api/users.
 */
export const getUser = async (authUserId: number, signal?: AbortSignal): Promise<UsersUserResponse> => {
  let page = 1;
  const pageSize = 100;
  while (page <= 50) {
    const data = await listUsers({ pageNumber: page, pageSize }, signal);
    const found = data.items?.find((user) => user.id === authUserId);
    if (found) return found;
    const totalPages = Math.max(1, data.totalPages ?? data.pageCount ?? 1);
    if (!data.hasNextPage && page >= totalPages) break;
    page += 1;
  }
  throw new ApiError(404, "User not found", null, {
    title: "Not found",
    detail: "User not found",
    status: 404,
  });
};

export const useGetUser = (authUserId: number, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: usersKeys.detail(authUserId),
    queryFn: async ({ signal }) => {
      const cached = queryClient.getQueryData<UsersUserResponse>(usersKeys.detail(authUserId));
      if (cached?.id === authUserId) return cached;
      const user = await getUser(authUserId, signal);
      cacheUser(queryClient, user);
      return user;
    },
    enabled: Number.isFinite(authUserId) && authUserId > 0 && (options?.enabled ?? true),
    retry: (failureCount, error) => retryUnlessAuth(failureCount, error, [404]),
  });
};

/** POST /api/users */
export const createUser = async (
  body: UsersCreateUserRequest,
  signal?: AbortSignal,
): Promise<UsersUserResponse> =>
  apiRequest<UsersUserResponse>({
    method: "POST",
    path: "/api/users",
    body,
    signal,
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UsersCreateUserRequest) => createUser(body),
    onSuccess: (data) => {
      cacheUser(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
};

/** PUT /api/users/{authUserId} */
export const updateUser = async (
  authUserId: number,
  body: UsersUpdateUserRequest,
  signal?: AbortSignal,
): Promise<UsersUserResponse> =>
  apiRequest<UsersUserResponse>({
    method: "PUT",
    path: `/api/users/${encodeURIComponent(String(authUserId))}`,
    body,
    signal,
  });

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { authUserId: number; body: UsersUpdateUserRequest }) =>
      updateUser(vars.authUserId, vars.body),
    onSuccess: (data) => {
      cacheUser(queryClient, data);
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
};

/** GET /api/users/{authUserId}/sales-access */
export const getUserSalesAccess = async (
  authUserId: number,
  signal?: AbortSignal,
): Promise<UserSalesAccessResponse> =>
  apiRequest<UserSalesAccessResponse>({
    method: "GET",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/sales-access`,
    signal,
  });

export const useGetUserSalesAccess = (authUserId: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: usersKeys.salesAccess(authUserId),
    queryFn: ({ signal }) => getUserSalesAccess(authUserId, signal),
    enabled: Number.isFinite(authUserId) && authUserId > 0 && (options?.enabled ?? true),
    retry: (failureCount, error) => retryUnlessAuth(failureCount, error, [404]),
  });

const useSalesAccessMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<UserSalesAccessResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      cacheSalesAccess(queryClient, data);
    },
  });
};

/** PUT /api/users/{authUserId}/agent-access/{agentId} */
export const grantUserAgentAccess = async (
  authUserId: number,
  agentId: string,
  signal?: AbortSignal,
): Promise<UserSalesAccessResponse> =>
  apiRequest<UserSalesAccessResponse>({
    method: "PUT",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/agent-access/${encodeURIComponent(agentId)}`,
    signal,
  });

export const useGrantUserAgentAccess = () =>
  useSalesAccessMutation((vars: { authUserId: number; agentId: string }) =>
    grantUserAgentAccess(vars.authUserId, vars.agentId),
  );

/** DELETE /api/users/{authUserId}/agent-access/{agentId} */
export const revokeUserAgentAccess = async (
  authUserId: number,
  agentId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/agent-access/${encodeURIComponent(agentId)}`,
    signal,
  });

export const useRevokeUserAgentAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { authUserId: number; agentId: string }) =>
      revokeUserAgentAccess(vars.authUserId, vars.agentId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.salesAccess(vars.authUserId) });
    },
  });
};

/** POST /api/users/{authUserId}/agent-access/all */
export const grantUserAllAgentsAccess = async (
  authUserId: number,
  signal?: AbortSignal,
): Promise<UserSalesAccessResponse> =>
  apiRequest<UserSalesAccessResponse>({
    method: "POST",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/agent-access/all`,
    signal,
  });

export const useGrantUserAllAgentsAccess = () =>
  useSalesAccessMutation((authUserId: number) => grantUserAllAgentsAccess(authUserId));

/** POST /api/users/{authUserId}/partner-office-access/partners/{partnerId} */
export const grantUserAllPartnerOfficesAccess = async (
  authUserId: number,
  partnerId: string,
  signal?: AbortSignal,
): Promise<UserSalesAccessResponse> =>
  apiRequest<UserSalesAccessResponse>({
    method: "POST",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/partner-office-access/partners/${encodeURIComponent(partnerId)}`,
    signal,
  });

export const useGrantUserAllPartnerOfficesAccess = () =>
  useSalesAccessMutation((vars: { authUserId: number; partnerId: string }) =>
    grantUserAllPartnerOfficesAccess(vars.authUserId, vars.partnerId),
  );

/** PUT /api/users/{authUserId}/partner-office-access/{partnerOfficeId} */
export const grantUserPartnerOfficeAccess = async (
  authUserId: number,
  partnerOfficeId: string,
  signal?: AbortSignal,
): Promise<UserSalesAccessResponse> =>
  apiRequest<UserSalesAccessResponse>({
    method: "PUT",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/partner-office-access/${encodeURIComponent(partnerOfficeId)}`,
    signal,
  });

export const useGrantUserPartnerOfficeAccess = () =>
  useSalesAccessMutation((vars: { authUserId: number; partnerOfficeId: string }) =>
    grantUserPartnerOfficeAccess(vars.authUserId, vars.partnerOfficeId),
  );

/** DELETE /api/users/{authUserId}/partner-office-access/{partnerOfficeId} */
export const revokeUserPartnerOfficeAccess = async (
  authUserId: number,
  partnerOfficeId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/users/${encodeURIComponent(String(authUserId))}/partner-office-access/${encodeURIComponent(partnerOfficeId)}`,
    signal,
  });

export const useRevokeUserPartnerOfficeAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { authUserId: number; partnerOfficeId: string }) =>
      revokeUserPartnerOfficeAccess(vars.authUserId, vars.partnerOfficeId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.salesAccess(vars.authUserId) });
    },
  });
};
