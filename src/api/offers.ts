import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  OffersOfferYearDiscountRequestResponse,
  OffersOfferYearDocumentResponse,
  OffersOfferYearResponse,
  OffersOfferYearReviewFlagResponse,
  OffersCalculatePremiumRequest,
  OffersOfferPremiumPreview,
  OffersOverwriteOfferYearRequest,
  OffersRejectOfferYearDocumentRequest,
  OffersRequestOfferYearDiscountRequest,
  OffersSubmitOfferYearDocumentRequest,
  PaginationPagedListOfOfferResponse,
  PaginationPagedListOfRenewalDueResponse,
  PoliciesIssuePolicyRequest,
  PoliciesPolicyResponse,
} from "./types";

export const offersKeys = {
  all: [...apiKeys.all, "offers"] as const,
  lists: () => [...offersKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...offersKeys.lists(), params ?? {}] as const,
  details: () => [...offersKeys.all, "detail"] as const,
  detail: (id: string) => [...offersKeys.details(), id] as const,
  premium: (offerId: string) => [...offersKeys.detail(offerId), "premium"] as const,
  premiumCalc: (params: OffersCalculatePremiumRequest) =>
    [...offersKeys.all, "premium-calc", params] as const,
  yearDocuments: (offerId: string, year: string) =>
    [...offersKeys.detail(offerId), "years", year, "documents"] as const,
  renewalsDue: (params?: Record<string, unknown>) =>
    [...offersKeys.all, "renewals-due", params ?? {}] as const,
};

/** POST /api/offers/{offerId}/years/{year}/policy */
export const issuePolicy = async (
  offerId: string,
  year: string,
  body?: PoliciesIssuePolicyRequest,
  signal?: AbortSignal
): Promise<PoliciesPolicyResponse> =>
  apiRequest<PoliciesPolicyResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/policy`,
    ...(body !== undefined ? { body } : {}),
    signal,
  });

export const useIssuePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      body?: PoliciesIssuePolicyRequest;
    }) =>
      issuePolicy(vars.offerId, vars.year, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "policies"] });
    },
  });
};

/** POST /api/offers/{offerId}/policy */
export const issueOfferPolicy = async (
  offerId: string,
  body?: PoliciesIssuePolicyRequest,
  signal?: AbortSignal
): Promise<PoliciesPolicyResponse> =>
  apiRequest<PoliciesPolicyResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/policy`,
    body: {},
    signal,
  });

export const useIssueOfferPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; body?: PoliciesIssuePolicyRequest }) =>
      issueOfferPolicy(vars.offerId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "policies"] });
    },
  });
};

/** POST /api/offers/{offerId}/renewal */
export const renewOffer = async (
  offerId: string,
  signal?: AbortSignal
): Promise<PoliciesPolicyResponse> =>
  apiRequest<PoliciesPolicyResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/renewal`,
    signal,
    body: {}
  });

export const useRenewOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => renewOffer(offerId),
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

/** POST /api/offers/{offerId}/years/{year}/discount-requests/{requestId}/approval */
export const approveOfferYearDiscount = async (offerId: string, year: string, requestId: string, signal?: AbortSignal): Promise<OffersOfferYearResponse> =>
  apiRequest<OffersOfferYearResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/discount-requests/${encodeURIComponent(requestId)}/approval`,
    signal,
  });

export const useApproveOfferYearDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requestId: string;
    }) =>
      approveOfferYearDiscount(vars.offerId, vars.year, vars.requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/years/{year}/documents/{requirementId}/approval */
export const approveOfferYearDocument = async (offerId: string, year: string, requirementId: string, signal?: AbortSignal): Promise<OffersOfferYearDocumentResponse> =>
  apiRequest<OffersOfferYearDocumentResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/documents/${encodeURIComponent(requirementId)}/approval`,
    signal,
  });

export const useApproveOfferYearDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requirementId: string;
    }) =>
      approveOfferYearDocument(vars.offerId, vars.year, vars.requirementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/years/{year}/review-flags/{flagId}/approval */
export const approveOfferYearReviewFlag = async (
  offerId: string,
  year: string,
  flagId: string,
  signal?: AbortSignal
): Promise<OffersOfferYearReviewFlagResponse> =>
  apiRequest<OffersOfferYearReviewFlagResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/review-flags/${encodeURIComponent(flagId)}/approval`,
    signal,
  });

export const useApproveOfferYearReviewFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; year: string; flagId: string }) =>
      approveOfferYearReviewFlag(vars.offerId, vars.year, vars.flagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

const mapPremiumPreviewRows = (
  rows: OffersOfferYearResponse[] | null | undefined,
): OffersOfferPremiumPreview[] =>
  (rows ?? []).map((s) => ({
    year: s.year,
    insuredAmount: s.insuredAmount ?? 0,
    premium: s.premium ?? 0,
    payPremium: s.payPremium ?? s.premium ?? 0,
  }));

/**
 * POST /api/offers/{offerId}/premium
 * Non-persisting premium preview for a draft offer (per loan-disbursement year).
 * Only the amount fields are kept from the offer-year response.
 */
export const previewOfferPremium = async (
  offerId: string,
  signal?: AbortSignal
): Promise<OffersOfferPremiumPreview[]> => {
  const rows = await apiRequest<OffersOfferYearResponse[]>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/premium`,
    signal,
    body: {},
  });
  return mapPremiumPreviewRows(rows);
};

export const usePreviewOfferPremium = (
  offerId: string,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: offersKeys.premium(offerId),
    queryFn: ({ signal }) => previewOfferPremium(offerId, signal),
    enabled: Boolean(offerId) && (options?.enabled ?? true),
    retry: false,
  });

/**
 * POST /api/offers/premium
 * Unbound premium preview from product, insured demographics, and loan disbursements.
 */
export const calculateOffersPremium = async (
  body: OffersCalculatePremiumRequest,
  signal?: AbortSignal,
): Promise<OffersOfferPremiumPreview[]> => {
  const rows = await apiRequest<OffersOfferYearResponse[]>({
    method: "POST",
    path: "/api/offers/premium",
    signal,
    body,
  });
  return mapPremiumPreviewRows(rows);
};

export const useCalculateOffersPremium = (
  body: OffersCalculatePremiumRequest | null,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: body
      ? offersKeys.premiumCalc(body)
      : [...offersKeys.all, "premium-calc", "idle"],
    queryFn: ({ signal }) => calculateOffersPremium(body!, signal),
    enabled: Boolean(body) && (options?.enabled ?? true),
    retry: false,
    placeholderData: keepPreviousData,
  });

/** POST /api/offers/{offerId}/years */
export const calculateOfferYears = async (offerId: string, signal?: AbortSignal): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years`,
    signal,
    body: {}
  });

export const useCalculateOfferYears = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => calculateOfferYears(offerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** PUT /api/offers/{offerId}/years/{year}/overwrite — manual amount override. */
export const overwriteOfferYear = async (
  body: OffersOverwriteOfferYearRequest,
  signal?: AbortSignal
): Promise<OffersOfferYearResponse> =>
  apiRequest<OffersOfferYearResponse>({
    method: "PUT",
    path: `/api/offers/${encodeURIComponent(body.offerId)}/years/${encodeURIComponent(body.year)}/overwrite`,
    body,
    signal,
  });

export const useOverwriteOfferYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OffersOverwriteOfferYearRequest) => overwriteOfferYear(body),
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

/** POST /api/offers/{offerId}/years/{year}/cancellation */
export const cancelOfferYear = async (offerId: string, year: string, signal?: AbortSignal): Promise<OffersOfferYearResponse> =>
  apiRequest<OffersOfferYearResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/cancellation`,
    signal,
  });

export const useCancelOfferYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
    }) =>
      cancelOfferYear(vars.offerId, vars.year),
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

export type ListOffersQuery = {
  status?: string;
  productId?: string;
  currency?: string;
  createdFromUtc?: string;
  createdToUtc?: string;
  partyId?: string;
  personId?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/offers */
export const listOffers = async (
  query?: ListOffersQuery,
  signal?: AbortSignal
): Promise<PaginationPagedListOfOfferResponse> =>
  apiRequest<PaginationPagedListOfOfferResponse>({
    method: "GET",
    path: `/api/offers`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListOffers = (query?: ListOffersQuery, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: offersKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listOffers(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

export type ListRenewalsDueQuery = {
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/offers/renewals-due */
export const listRenewalsDue = async (
  query?: ListRenewalsDueQuery,
  signal?: AbortSignal
): Promise<PaginationPagedListOfRenewalDueResponse> =>
  apiRequest<PaginationPagedListOfRenewalDueResponse>({
    method: "GET",
    path: `/api/offers/renewals-due`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListRenewalsDue = (
  query?: ListRenewalsDueQuery,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: offersKeys.renewalsDue(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listRenewalsDue(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
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

/** GET /api/offers/{offerId}/years/{year}/documents */
export const listOfferYearDocuments = async (offerId: string, year: string, signal?: AbortSignal): Promise<OffersOfferYearDocumentResponse[]> =>
  apiRequest<OffersOfferYearDocumentResponse[]>({
    method: "GET",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/documents`,
    signal,
  });

export const useListOfferYearDocuments = (offerId: string, year: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: offersKeys.yearDocuments(offerId, year),
    queryFn: ({ signal }) => listOfferYearDocuments(offerId, year, signal),
    enabled: Boolean(offerId) && Boolean(year) && (options?.enabled ?? true),
  });

/** POST /api/offers/{offerId}/years/{year}/discount-requests/{requestId}/rejection */
export const rejectOfferYearDiscount = async (offerId: string, year: string, requestId: string, signal?: AbortSignal): Promise<OffersOfferYearDiscountRequestResponse> =>
  apiRequest<OffersOfferYearDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/discount-requests/${encodeURIComponent(requestId)}/rejection`,
    signal,
  });

export const useRejectOfferYearDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requestId: string;
    }) =>
      rejectOfferYearDiscount(vars.offerId, vars.year, vars.requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/years/{year}/documents/{requirementId}/rejection */
export const rejectOfferYearDocument = async (offerId: string, year: string, requirementId: string, body: OffersRejectOfferYearDocumentRequest, signal?: AbortSignal): Promise<OffersOfferYearDocumentResponse> =>
  apiRequest<OffersOfferYearDocumentResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/documents/${encodeURIComponent(requirementId)}/rejection`,
    body,
    signal,
  });

export const useRejectOfferYearDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requirementId: string;
      body: OffersRejectOfferYearDocumentRequest;
    }) =>
      rejectOfferYearDocument(vars.offerId, vars.year, vars.requirementId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/years/{year}/review-flags/{flagId}/rejection */
export const rejectOfferYearReviewFlag = async (
  offerId: string,
  year: string,
  flagId: string,
  signal?: AbortSignal
): Promise<OffersOfferYearReviewFlagResponse> =>
  apiRequest<OffersOfferYearReviewFlagResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/review-flags/${encodeURIComponent(flagId)}/rejection`,
    signal,
  });

export const useRejectOfferYearReviewFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; year: string; flagId: string }) =>
      rejectOfferYearReviewFlag(vars.offerId, vars.year, vars.flagId),
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

/** POST /api/offers/{offerId}/years/{year}/discount-requests */
export const requestOfferYearDiscount = async (offerId: string, year: string, body: OffersRequestOfferYearDiscountRequest, signal?: AbortSignal): Promise<OffersOfferYearDiscountRequestResponse> =>
  apiRequest<OffersOfferYearDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/discount-requests`,
    body,
    signal,
  });

export const useRequestOfferYearDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      body: OffersRequestOfferYearDiscountRequest;
    }) =>
      requestOfferYearDiscount(vars.offerId, vars.year, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};

/** POST /api/offers/{offerId}/years/{year}/documents/{requirementId}/submission */
export const submitOfferYearDocument = async (offerId: string, year: string, requirementId: string, body: OffersSubmitOfferYearDocumentRequest, signal?: AbortSignal): Promise<OffersOfferYearDocumentResponse> =>
  apiRequest<OffersOfferYearDocumentResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/years/${encodeURIComponent(year)}/documents/${encodeURIComponent(requirementId)}/submission`,
    body,
    signal,
  });

export const useSubmitOfferYearDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      year: string;
      requirementId: string;
      body: OffersSubmitOfferYearDocumentRequest;
    }) =>
      submitOfferYearDocument(vars.offerId, vars.year, vars.requirementId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
};
