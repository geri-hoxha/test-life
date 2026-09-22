import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import { getDocument } from "./documents";
import type {
  DocumentsDocumentTypesCreateDocumentTypeRequest,
  DocumentsDocumentTypesDocumentTypeResponse,
  DocumentsDocumentTypesListDocumentTypesRequest,
  DocumentsDocumentTypesUpdateDocumentTypeRequest,
  PaginationPagedListOfDocumentTypeResponse,
} from "./types";

export type DocumentTypeDetail = DocumentsDocumentTypesDocumentTypeResponse & {
  /** Resolved from `GET /api/documents/{templateDocumentId}` when a template is linked. */
  templateOriginalFileName?: string;
};

export type ListDocumentTypesQuery = DocumentsDocumentTypesListDocumentTypesRequest & {
  pageNumber?: number;
  pageSize?: number;
};

export const documentTypesKeys = {
  all: [...apiKeys.all, "document-types"] as const,
  lists: () => [...documentTypesKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...documentTypesKeys.lists(), params ?? {}] as const,
  details: () => [...documentTypesKeys.all, "detail"] as const,
  detail: (id: string) => [...documentTypesKeys.details(), id] as const,
};

/** Build create/update body. `templateDocumentId` is omitted when empty. */
export const buildDocumentTypeWriteBody = (
  name: string,
  description: string,
  templateDocumentId?: string | null,
): DocumentsDocumentTypesCreateDocumentTypeRequest => {
  const body: DocumentsDocumentTypesCreateDocumentTypeRequest = { name, description };
  const templateId = templateDocumentId?.trim();
  if (templateId) body.templateDocumentId = templateId;
  return body;
};

/** POST /api/document-types */
export const createDocumentType = async (
  body: DocumentsDocumentTypesCreateDocumentTypeRequest,
  signal?: AbortSignal,
): Promise<DocumentsDocumentTypesDocumentTypeResponse> =>
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
    onSuccess: (data) => {
      if (data.id) {
        queryClient.setQueryData(documentTypesKeys.detail(data.id), data);
      }
      void queryClient.invalidateQueries({ queryKey: documentTypesKeys.all });
    },
  });
};

/** GET /api/document-types */
export const listDocumentTypes = async (
  query?: ListDocumentTypesQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfDocumentTypeResponse> =>
  apiRequest<PaginationPagedListOfDocumentTypeResponse>({
    method: "GET",
    path: `/api/document-types`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListDocumentTypes = (
  query?: ListDocumentTypesQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: documentTypesKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listDocumentTypes(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
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
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: documentTypesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: documentTypesKeys.all });
    },
  });
};

/** GET /api/document-types/{id} — if `templateDocumentId` is present, load its original file name. */
export const getDocumentType = async (
  id: string,
  signal?: AbortSignal,
): Promise<DocumentTypeDetail> => {
  const data = await apiRequest<DocumentsDocumentTypesDocumentTypeResponse>({
    method: "GET",
    path: `/api/document-types/${encodeURIComponent(id)}`,
    signal,
  });

  const templateId = data.templateDocumentId?.trim();
  if (!templateId) return data;

  try {
    const template = await getDocument(templateId, signal);
    const templateOriginalFileName = template.originalFileName?.trim();
    return templateOriginalFileName ? { ...data, templateOriginalFileName } : data;
  } catch {
    return data;
  }
};

export const useGetDocumentType = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: documentTypesKeys.detail(id),
    queryFn: ({ signal }) => getDocumentType(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/document-types/{id} */
export const updateDocumentType = async (
  id: string,
  body: DocumentsDocumentTypesUpdateDocumentTypeRequest,
  signal?: AbortSignal,
): Promise<DocumentsDocumentTypesDocumentTypeResponse> =>
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
    }) => updateDocumentType(vars.id, vars.body),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(documentTypesKeys.detail(vars.id), data);
      void queryClient.invalidateQueries({ queryKey: documentTypesKeys.all });
    },
  });
};
