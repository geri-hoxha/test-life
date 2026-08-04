import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfProductGroupResponse,
  ProductGroupsCreateProductGroupRequest,
  ProductGroupsProductGroupResponse,
  ProductGroupsUpdateProductGroupRequest,
} from "./types";

export const productGroupsKeys = {
  all: [...apiKeys.all, "product-groups"] as const,
  lists: () => [...productGroupsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...productGroupsKeys.lists(), params ?? {}] as const,
  details: () => [...productGroupsKeys.all, "detail"] as const,
  detail: (id: string) => [...productGroupsKeys.details(), id] as const,
};

/** POST /api/product-groups */
export const createProductGroup = async (body: ProductGroupsCreateProductGroupRequest, signal?: AbortSignal): Promise<ProductGroupsProductGroupResponse> =>
  apiRequest<ProductGroupsProductGroupResponse>({
    method: "POST",
    path: `/api/product-groups`,
    body,
    signal,
  });

export const useCreateProductGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductGroupsCreateProductGroupRequest) => createProductGroup(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productGroupsKeys.all });
    },
  });
};

/** GET /api/product-groups */
export const listProductGroups = async (query?: {
  pageNumber?: number;
  pageSize?: number;
}, signal?: AbortSignal): Promise<PaginationPagedListOfProductGroupResponse> =>
  apiRequest<PaginationPagedListOfProductGroupResponse>({
    method: "GET",
    path: `/api/product-groups`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListProductGroups = (query?: {
  pageNumber?: number;
  pageSize?: number;
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: productGroupsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listProductGroups(query, signal),
    enabled: options?.enabled ?? true,
  });

/** DELETE /api/product-groups/{id} */
export const deleteProductGroup = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/product-groups/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteProductGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProductGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productGroupsKeys.all });
    },
  });
};

/** GET /api/product-groups/{id} */
export const getProductGroup = async (id: string, signal?: AbortSignal): Promise<ProductGroupsProductGroupResponse> =>
  apiRequest<ProductGroupsProductGroupResponse>({
    method: "GET",
    path: `/api/product-groups/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetProductGroup = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: productGroupsKeys.detail(id),
    queryFn: ({ signal }) => getProductGroup(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/product-groups/{id} */
export const updateProductGroup = async (id: string, body: ProductGroupsUpdateProductGroupRequest, signal?: AbortSignal): Promise<ProductGroupsProductGroupResponse> =>
  apiRequest<ProductGroupsProductGroupResponse>({
    method: "PUT",
    path: `/api/product-groups/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateProductGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: ProductGroupsUpdateProductGroupRequest;
    }) =>
      updateProductGroup(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productGroupsKeys.all });
    },
  });
};
