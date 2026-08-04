import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  DocumentsDocumentTypesCreateDocumentTypeRequest,
  DocumentsDocumentTypesDocumentTypeResponse,
  DocumentsDocumentTypesUpdateDocumentTypeRequest,
  PaginationPagedListOfDocumentTypeResponse,
} from "./types";

export const documentTypesKeys = {
  all: [...apiKeys.all, "document-types"] as const,
  lists: () => [...documentTypesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...documentTypesKeys.lists(), params ?? {}] as const,
  details: () => [...documentTypesKeys.all, "detail"] as const,
  detail: (id: string) => [...documentTypesKeys.details(), id] as const,
};

/** POST /api/document-types */
export const createDocumentType = async (body: DocumentsDocumentTypesCreateDocumentTypeRequest, signal?: AbortSignal): Promise<DocumentsDocumentTypesDocumentTypeResponse> =>
  apiRequest<DocumentsDocumentTypesDocumentTypeResponse>({
    method: "POST",
    path: `/api/document-types`,
    body,
    signal,
  });

export const useCreateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DocumentsDocumentTypesCreateDocumentTypeRequest) => createDocumentType(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentTypesKeys.all });
    },
  });
};

/** GET /api/document-types */
export const listDocumentTypes = async (query?: {
  pageNumber?: number;
  pageSize?: number;
}, signal?: AbortSignal): Promise<PaginationPagedListOfDocumentTypeResponse> =>
  apiRequest<PaginationPagedListOfDocumentTypeResponse>({
    method: "GET",
    path: `/api/document-types`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListDocumentTypes = (query?: {
  pageNumber?: number;
  pageSize?: number;
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: documentTypesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listDocumentTypes(query, signal),
    enabled: options?.enabled ?? true,
  });

/** DELETE /api/document-types/{id} */
export const deleteDocumentType = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/document-types/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentType(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentTypesKeys.all });
    },
  });
};

/** GET /api/document-types/{id} */
export const getDocumentType = async (id: string, signal?: AbortSignal): Promise<DocumentsDocumentTypesDocumentTypeResponse> =>
  apiRequest<DocumentsDocumentTypesDocumentTypeResponse>({
    method: "GET",
    path: `/api/document-types/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetDocumentType = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: documentTypesKeys.detail(id),
    queryFn: ({ signal }) => getDocumentType(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/document-types/{id} */
export const updateDocumentType = async (id: string, body: DocumentsDocumentTypesUpdateDocumentTypeRequest, signal?: AbortSignal): Promise<DocumentsDocumentTypesDocumentTypeResponse> =>
  apiRequest<DocumentsDocumentTypesDocumentTypeResponse>({
    method: "PUT",
    path: `/api/document-types/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: DocumentsDocumentTypesUpdateDocumentTypeRequest;
    }) =>
      updateDocumentType(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentTypesKeys.all });
    },
  });
};
