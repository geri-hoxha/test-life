import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfPersonResponse,
  PeopleCreatePersonRequest,
  PeoplePersonResponse,
  PeopleUpdatePersonRequest,
} from "./types";

export const peopleKeys = {
  all: [...apiKeys.all, "people"] as const,
  lists: () => [...peopleKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...peopleKeys.lists(), params ?? {}] as const,
  details: () => [...peopleKeys.all, "detail"] as const,
  detail: (id: string) => [...peopleKeys.details(), id] as const,
};

/** POST /api/people */
export const createPerson = async (body: PeopleCreatePersonRequest, signal?: AbortSignal): Promise<PeoplePersonResponse> =>
  apiRequest<PeoplePersonResponse>({
    method: "POST",
    path: `/api/people`,
    body,
    signal,
  });

export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PeopleCreatePersonRequest) => createPerson(body),
    onSuccess: (data) => {
      if (data.id) {
        queryClient.setQueryData(peopleKeys.detail(data.id), data);
      }
      void queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
    },
  });
};

/** GET /api/people */
export const listPeople = async (query?: {
  pageNumber?: number;
  pageSize?: number;
}, signal?: AbortSignal): Promise<PaginationPagedListOfPersonResponse> =>
  apiRequest<PaginationPagedListOfPersonResponse>({
    method: "GET",
    path: `/api/people`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListPeople = (query?: {
  pageNumber?: number;
  pageSize?: number;
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: peopleKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listPeople(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** GET /api/people/{id} */
export const getPerson = async (id: string, signal?: AbortSignal): Promise<PeoplePersonResponse> =>
  apiRequest<PeoplePersonResponse>({
    method: "GET",
    path: `/api/people/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetPerson = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: peopleKeys.detail(id),
    queryFn: ({ signal }) => getPerson(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/people/{id} */
export const updatePerson = async (id: string, body: PeopleUpdatePersonRequest, signal?: AbortSignal): Promise<PeoplePersonResponse> =>
  apiRequest<PeoplePersonResponse>({
    method: "PUT",
    path: `/api/people/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: PeopleUpdatePersonRequest;
    }) =>
      updatePerson(vars.id, vars.body),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(peopleKeys.detail(vars.id), data);
      void queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
    },
  });
};
