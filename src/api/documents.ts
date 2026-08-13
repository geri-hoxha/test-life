import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  DocumentsDocumentResponse,
  DocumentsListDocumentsRequest,
  DocumentsUpdateDocumentRequest,
  PaginationPagedListOfDocumentResponse,
} from "./types";

export type ListDocumentsQuery = DocumentsListDocumentsRequest;

export const documentsKeys = {
  all: [...apiKeys.all, "documents"] as const,
  lists: () => [...documentsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...documentsKeys.lists(), params ?? {}] as const,
  details: () => [...documentsKeys.all, "detail"] as const,
  detail: (id: string) => [...documentsKeys.details(), id] as const,
  file: (id: string) => [...documentsKeys.details(), id, "file"] as const,
};

/** POST /api/documents */
export const createDocument = async (body: FormData, signal?: AbortSignal): Promise<DocumentsDocumentResponse> =>
  apiRequest<DocumentsDocumentResponse>({
    method: "POST",
    path: `/api/documents`,
    body,
    multipart: true,
    signal,
  });

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FormData) => createDocument(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
};

/** GET /api/documents */
export const listDocuments = async (
  query?: ListDocumentsQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfDocumentResponse> =>
  apiRequest<PaginationPagedListOfDocumentResponse>({
    method: "GET",
    path: `/api/documents`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListDocuments = (
  query?: ListDocumentsQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: documentsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listDocuments(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** DELETE /api/documents/{id} */
export const deleteDocument = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/documents/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
};

/** GET /api/documents/{id} */
export const getDocument = async (id: string, signal?: AbortSignal): Promise<DocumentsDocumentResponse> =>
  apiRequest<DocumentsDocumentResponse>({
    method: "GET",
    path: `/api/documents/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetDocument = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: documentsKeys.detail(id),
    queryFn: ({ signal }) => getDocument(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/documents/{id} */
export const updateDocument = async (
  id: string,
  body: DocumentsUpdateDocumentRequest,
  signal?: AbortSignal,
): Promise<DocumentsDocumentResponse> =>
  apiRequest<DocumentsDocumentResponse>({
    method: "PUT",
    path: `/api/documents/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: DocumentsUpdateDocumentRequest;
    }) => updateDocument(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
};

/** GET /api/documents/{id}/file */
export const getDocumentFile = async (id: string, signal?: AbortSignal): Promise<Blob> =>
  apiRequest<Blob>({
    method: "GET",
    path: `/api/documents/${encodeURIComponent(id)}/file`,
    binary: true,
    signal,
  });

export const useGetDocumentFile = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: documentsKeys.file(id),
    queryFn: ({ signal }) => getDocumentFile(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** Browser download for GET /api/documents/{id}/file */
export const downloadDocumentFile = async (id: string, fileName?: string) => {
  const blob = await getDocumentFile(id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName?.trim() || "document";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Helper to build multipart body for `createDocument`. */
export const buildCreateDocumentFormData = (file: Blob, fileName?: string) => {
  const form = new FormData();
  form.append("file", file, fileName);
  return form;
};
