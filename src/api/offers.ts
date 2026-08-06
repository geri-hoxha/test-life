import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  OffersAddOfferInsuredPersonRequest,
  OffersAddOfferLoanDisbursementRequest,
  OffersAddOfferParticipantRequest,
  OffersCreateOfferRequest,
  OffersOfferInsuredPersonResponse,
  OffersOfferLoanDisbursementResponse,
  OffersOfferParticipantResponse,
  OffersOfferResponse,
  OffersOfferScheduleDiscountRequestResponse,
  OffersOfferScheduleDocumentResponse,
  OffersOfferScheduleResponse,
  OffersRejectOfferScheduleDocumentRequest,
  OffersRequestOfferScheduleDiscountRequest,
  OffersSubmitOfferScheduleDocumentRequest,
  PaginationPagedListOfOfferResponse,
  PoliciesIssuePolicyRequest,
  PoliciesPolicyResponse,
} from "./types";

export const offersKeys = {
  all: [...apiKeys.all, "offers"] as const,
  lists: () => [...offersKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...offersKeys.lists(), params ?? {}] as const,
  details: () => [...offersKeys.all, "detail"] as const,
  detail: (id: string) => [...offersKeys.details(), id] as const,
  scheduleDocuments: (offerId: string, year: string) =>
    [...offersKeys.detail(offerId), "schedules", year, "documents"] as const,
};

/** POST /api/offers/{offerId}/schedules/{year}/policy */
export const issuePolicy = async (offerId: string, year: string, body: PoliciesIssuePolicyRequest, signal?: AbortSignal): Promise<PoliciesPolicyResponse> =>
  apiRequest<PoliciesPolicyResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/policy`,
    body,
    signal,
  });

export const useIssuePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      body: PoliciesIssuePolicyRequest;
    }) =>
      issuePolicy(vars.offerId, vars.year, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "policies"] });
    },
  });
};

/** POST /api/offers/{offerId}/insured-persons */
export const addOfferInsuredPerson = async (offerId: string, body: OffersAddOfferInsuredPersonRequest, signal?: AbortSignal): Promise<OffersOfferInsuredPersonResponse> =>
  apiRequest<OffersOfferInsuredPersonResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/insured-persons`,
    body,
    signal,
  });

export const useAddOfferInsuredPerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      body: OffersAddOfferInsuredPersonRequest;
    }) =>
      addOfferInsuredPerson(vars.offerId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/loan-disbursements */
export const addOfferLoanDisbursement = async (offerId: string, body: OffersAddOfferLoanDisbursementRequest, signal?: AbortSignal): Promise<OffersOfferLoanDisbursementResponse> =>
  apiRequest<OffersOfferLoanDisbursementResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/loan-disbursements`,
    body,
    signal,
  });

export const useAddOfferLoanDisbursement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      body: OffersAddOfferLoanDisbursementRequest;
    }) =>
      addOfferLoanDisbursement(vars.offerId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/participants */
export const addOfferParticipant = async (offerId: string, body: OffersAddOfferParticipantRequest, signal?: AbortSignal): Promise<OffersOfferParticipantResponse> =>
  apiRequest<OffersOfferParticipantResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/participants`,
    body,
    signal,
  });

export const useAddOfferParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      body: OffersAddOfferParticipantRequest;
    }) =>
      addOfferParticipant(vars.offerId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules/{year}/discount-requests/{requestId}/approval */
export const approveOfferScheduleDiscount = async (offerId: string, year: string, requestId: string, signal?: AbortSignal): Promise<OffersOfferScheduleResponse> =>
  apiRequest<OffersOfferScheduleResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/discount-requests/${encodeURIComponent(requestId)}/approval`,
    signal,
  });

export const useApproveOfferScheduleDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requestId: string;
    }) =>
      approveOfferScheduleDiscount(vars.offerId, vars.year, vars.requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules/{year}/documents/{requirementId}/approval */
export const approveOfferScheduleDocument = async (offerId: string, year: string, requirementId: string, signal?: AbortSignal): Promise<OffersOfferScheduleDocumentResponse> =>
  apiRequest<OffersOfferScheduleDocumentResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/documents/${encodeURIComponent(requirementId)}/approval`,
    signal,
  });

export const useApproveOfferScheduleDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requirementId: string;
    }) =>
      approveOfferScheduleDocument(vars.offerId, vars.year, vars.requirementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules */
export const calculateOfferSchedules = async (offerId: string, signal?: AbortSignal): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules`,
    signal,
    body: {}
  });

export const useCalculateOfferSchedules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => calculateOfferSchedules(offerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/cancellations */
export const cancelOffer = async (offerId: string, signal?: AbortSignal): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/cancellations`,
    signal,
  });

export const useCancelOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => cancelOffer(offerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules/{year}/cancellation */
export const cancelOfferSchedule = async (offerId: string, year: string, signal?: AbortSignal): Promise<OffersOfferScheduleResponse> =>
  apiRequest<OffersOfferScheduleResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/cancellation`,
    signal,
  });

export const useCancelOfferSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
    }) =>
      cancelOfferSchedule(vars.offerId, vars.year),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers */
export const createOffer = async (body: OffersCreateOfferRequest, signal?: AbortSignal): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers`,
    body,
    signal,
  });

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OffersCreateOfferRequest) => createOffer(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** GET /api/offers */
export const listOffers = async (query?: {
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}, signal?: AbortSignal): Promise<PaginationPagedListOfOfferResponse> =>
  apiRequest<PaginationPagedListOfOfferResponse>({
    method: "GET",
    path: `/api/offers`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListOffers = (query?: {
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: offersKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listOffers(query, signal),
    enabled: options?.enabled ?? true,
  });

/** GET /api/offers/{id} */
export const getOffer = async (id: string, signal?: AbortSignal): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "GET",
    path: `/api/offers/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetOffer = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: offersKeys.detail(id),
    queryFn: ({ signal }) => getOffer(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** GET /api/offers/{offerId}/schedules/{year}/documents */
export const listOfferScheduleDocuments = async (offerId: string, year: string, signal?: AbortSignal): Promise<OffersOfferScheduleDocumentResponse[]> =>
  apiRequest<OffersOfferScheduleDocumentResponse[]>({
    method: "GET",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/documents`,
    signal,
  });

export const useListOfferScheduleDocuments = (offerId: string, year: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: offersKeys.scheduleDocuments(offerId, year),
    queryFn: ({ signal }) => listOfferScheduleDocuments(offerId, year, signal),
    enabled: Boolean(offerId) && Boolean(year) && (options?.enabled ?? true),
  });

/** POST /api/offers/{offerId}/schedules/{year}/discount-requests/{requestId}/rejection */
export const rejectOfferScheduleDiscount = async (offerId: string, year: string, requestId: string, signal?: AbortSignal): Promise<OffersOfferScheduleDiscountRequestResponse> =>
  apiRequest<OffersOfferScheduleDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/discount-requests/${encodeURIComponent(requestId)}/rejection`,
    signal,
  });

export const useRejectOfferScheduleDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requestId: string;
    }) =>
      rejectOfferScheduleDiscount(vars.offerId, vars.year, vars.requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules/{year}/documents/{requirementId}/rejection */
export const rejectOfferScheduleDocument = async (offerId: string, year: string, requirementId: string, body: OffersRejectOfferScheduleDocumentRequest, signal?: AbortSignal): Promise<OffersOfferScheduleDocumentResponse> =>
  apiRequest<OffersOfferScheduleDocumentResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/documents/${encodeURIComponent(requirementId)}/rejection`,
    body,
    signal,
  });

export const useRejectOfferScheduleDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requirementId: string;
      body: OffersRejectOfferScheduleDocumentRequest;
    }) =>
      rejectOfferScheduleDocument(vars.offerId, vars.year, vars.requirementId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** DELETE /api/offers/{offerId}/insured-persons/{insuredPersonId} */
export const removeOfferInsuredPerson = async (offerId: string, insuredPersonId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/offers/${encodeURIComponent(offerId)}/insured-persons/${encodeURIComponent(insuredPersonId)}`,
    signal,
  });

export const useRemoveOfferInsuredPerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      insuredPersonId: string;
    }) =>
      removeOfferInsuredPerson(vars.offerId, vars.insuredPersonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** DELETE /api/offers/{offerId}/loan-disbursements/{loanDisbursementId} */
export const removeOfferLoanDisbursement = async (offerId: string, loanDisbursementId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/offers/${encodeURIComponent(offerId)}/loan-disbursements/${encodeURIComponent(loanDisbursementId)}`,
    signal,
  });

export const useRemoveOfferLoanDisbursement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      loanDisbursementId: string;
    }) =>
      removeOfferLoanDisbursement(vars.offerId, vars.loanDisbursementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** DELETE /api/offers/{offerId}/participants/{participantId} */
export const removeOfferParticipant = async (offerId: string, participantId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/offers/${encodeURIComponent(offerId)}/participants/${encodeURIComponent(participantId)}`,
    signal,
  });

export const useRemoveOfferParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      participantId: string;
    }) =>
      removeOfferParticipant(vars.offerId, vars.participantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules/{year}/discount-requests */
export const requestOfferScheduleDiscount = async (offerId: string, year: string, body: OffersRequestOfferScheduleDiscountRequest, signal?: AbortSignal): Promise<OffersOfferScheduleDiscountRequestResponse> =>
  apiRequest<OffersOfferScheduleDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/discount-requests`,
    body,
    signal,
  });

export const useRequestOfferScheduleDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      body: OffersRequestOfferScheduleDiscountRequest;
    }) =>
      requestOfferScheduleDiscount(vars.offerId, vars.year, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/schedules/{year}/documents/{requirementId}/submission */
export const submitOfferScheduleDocument = async (offerId: string, year: string, requirementId: string, body: OffersSubmitOfferScheduleDocumentRequest, signal?: AbortSignal): Promise<OffersOfferScheduleDocumentResponse> =>
  apiRequest<OffersOfferScheduleDocumentResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/schedules/${encodeURIComponent(year)}/documents/${encodeURIComponent(requirementId)}/submission`,
    body,
    signal,
  });

export const useSubmitOfferScheduleDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requirementId: string;
      body: OffersSubmitOfferScheduleDocumentRequest;
    }) =>
      submitOfferScheduleDocument(vars.offerId, vars.year, vars.requirementId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};
