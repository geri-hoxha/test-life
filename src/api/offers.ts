import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  OffersAddOfferInsuredPersonRequest,
  OffersAddOfferParticipantRequest,
  OffersCreateOfferRequest,
  OffersOfferInsuredPersonResponse,
  OffersOfferListItemResponse,
  OffersOfferParticipantResponse,
  OffersOfferPeriodResponse,
  OffersListOffersRequest,
  OffersOfferPremiumPreview,
  OffersOfferResponse,
  OffersRefuseOfferDocumentRequest,
  OffersRequestOfferDiscountRequest,
  OffersResolveOfferReviewFlagRequest,
  OffersSubmitOfferDocumentRequest,
  OffersSubmitOfferLoanRequest,
  OffersSubmitOfferLoanResponse,
  OffersUnderwritingDiscountRequestResponse,
  OffersUnderwritingDocumentRequirementResponse,
  OffersUnderwritingReviewFlagResponse,
  OffersWaiveOfferDocumentRequest,
  PaginationPagedListOfOfferListItemResponse,
  PoliciesIssuePolicyRequest,
  PoliciesIssuePolicyResponse,
} from "./types";
import { makeLoanPeriodsAdjacent } from "@/lib/loan-periods";

export const offersKeys = {
  all: [...apiKeys.all, "offers"] as const,
  lists: () => [...offersKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...offersKeys.lists(), params ?? {}] as const,
  details: () => [...offersKeys.all, "detail"] as const,
  detail: (id: string) => [...offersKeys.details(), id] as const,
  premium: (offerId: string) => [...offersKeys.detail(offerId), "premium"] as const,
};

const cacheOffer = (
  queryClient: ReturnType<typeof useQueryClient>,
  offer: OffersOfferResponse | undefined,
) => {
  if (offer?.id) queryClient.setQueryData(offersKeys.detail(offer.id), offer);
};

const invalidateOffers = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: offersKeys.all });
};

const mapPremiumPreviewRows = (
  rows: OffersOfferPeriodResponse[] | null | undefined,
): OffersOfferPremiumPreview[] =>
  (rows ?? []).map((s) => ({
    sequenceNumber: s.sequenceNumber,
    year: s.sequenceNumber,
    insuredAmount: s.openingBalance ?? Math.max(0, ...(s.coverages ?? []).map((c) => c.sumInsured ?? 0)),
    premium: s.calculatedPremium ?? 0,
    payPremium: s.chargePremium ?? s.calculatedPremium ?? 0,
  }));

/** POST /api/offers/{offerId}/policy */
export const issueOfferPolicy = async (
  offerId: string,
  signal?: AbortSignal,
): Promise<PoliciesIssuePolicyResponse> =>
  apiRequest<PoliciesIssuePolicyResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/policy`,
    body: {} satisfies PoliciesIssuePolicyRequest,
    signal,
  });

export const useIssueOfferPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string }) => issueOfferPolicy(vars.offerId),
    onSuccess: (data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "policies"] });
      void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "invoices"] });
      const policyId = data.policy?.id;
      if (policyId) {
        void queryClient.invalidateQueries({ queryKey: [...apiKeys.all, "policies", "detail", policyId] });
      }
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/insured-persons */
export const addOfferInsuredPerson = async (
  offerId: string,
  body: OffersAddOfferInsuredPersonRequest,
  signal?: AbortSignal,
): Promise<OffersOfferInsuredPersonResponse> =>
  apiRequest<OffersOfferInsuredPersonResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/insured-persons`,
    body,
    signal,
  });

export const useAddOfferInsuredPerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; body: OffersAddOfferInsuredPersonRequest }) =>
      addOfferInsuredPerson(vars.offerId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/participants */
export const addOfferParticipant = async (
  offerId: string,
  body: OffersAddOfferParticipantRequest,
  signal?: AbortSignal,
): Promise<OffersOfferParticipantResponse> =>
  apiRequest<OffersOfferParticipantResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/participants`,
    body,
    signal,
  });

export const useAddOfferParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; body: OffersAddOfferParticipantRequest }) =>
      addOfferParticipant(vars.offerId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/premium — non-persisting premium preview. */
export const previewOfferPremium = async (
  offerId: string,
  signal?: AbortSignal,
): Promise<OffersOfferPremiumPreview[]> => {
  const rows = await apiRequest<OffersOfferPeriodResponse[]>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/premium`,
    signal,
  });
  return mapPremiumPreviewRows(rows);
};

export const usePreviewOfferPremium = (offerId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: offersKeys.premium(offerId),
    queryFn: ({ signal }) => previewOfferPremium(offerId, signal),
    enabled: Boolean(offerId) && (options?.enabled ?? true),
    retry: false,
  });

/** POST /api/offers/{offerId}/cancellations */
export const cancelOffer = async (
  offerId: string,
  signal?: AbortSignal,
): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/cancellations`,
    signal,
  });

export const useCancelOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => cancelOffer(offerId),
    onSuccess: (data) => {
      cacheOffer(queryClient, data);
      invalidateOffers(queryClient);
    },
  });
};

/** POST /api/offers */
export const createOffer = async (
  body: OffersCreateOfferRequest,
  signal?: AbortSignal,
): Promise<OffersOfferResponse> =>
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
    onSuccess: (data) => {
      cacheOffer(queryClient, data);
      invalidateOffers(queryClient);
    },
  });
};

export type ListOffersQuery = OffersListOffersRequest;

/** GET /api/offers */
export const listOffers = async (
  query?: ListOffersQuery,
  signal?: AbortSignal,
): Promise<PaginationPagedListOfOfferListItemResponse> =>
  apiRequest<PaginationPagedListOfOfferListItemResponse>({
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

/** GET /api/offers/{id} */
export const getOffer = async (
  id: string,
  signal?: AbortSignal,
): Promise<OffersOfferResponse> =>
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

/** POST /api/offers/{offerId}/loan-submissions */
export const submitOfferLoan = async (
  offerId: string,
  body: OffersSubmitOfferLoanRequest,
  signal?: AbortSignal,
): Promise<OffersSubmitOfferLoanResponse> => {
  const request = {
    sourceSystem: body.sourceSystem,
    externalReference: body.externalReference ?? null,
    periods: makeLoanPeriodsAdjacent(body.periods),
  };
  return apiRequest<OffersSubmitOfferLoanResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/loan-submissions`,
    body: {
      ...request,
      rawPayload: body.rawPayload ?? request,
    },
    signal,
  });
};

export const useSubmitOfferLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; body: OffersSubmitOfferLoanRequest }) =>
      submitOfferLoan(vars.offerId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/quotation */
export const quoteOffer = async (
  offerId: string,
  signal?: AbortSignal,
): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/quotation`,
    signal,
  });

export const useQuoteOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => quoteOffer(offerId),
    onSuccess: (data) => {
      cacheOffer(queryClient, data);
      invalidateOffers(queryClient);
    },
  });
};

/** POST /api/offers/{offerId}/rating */
export const rateOffer = async (
  offerId: string,
  signal?: AbortSignal,
): Promise<OffersOfferResponse> =>
  apiRequest<OffersOfferResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/rating`,
    signal,
  });

export const useRateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => rateOffer(offerId),
    onSuccess: (data) => {
      cacheOffer(queryClient, data);
      invalidateOffers(queryClient);
    },
  });
};

/** DELETE /api/offers/{offerId}/insured-persons/{insuredPersonId} */
export const removeOfferInsuredPerson = async (
  offerId: string,
  insuredPersonId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/offers/${encodeURIComponent(offerId)}/insured-persons/${encodeURIComponent(insuredPersonId)}`,
    signal,
  });

export const useRemoveOfferInsuredPerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; insuredPersonId: string }) =>
      removeOfferInsuredPerson(vars.offerId, vars.insuredPersonId),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** DELETE /api/offers/{offerId}/participants/{participantId} */
export const removeOfferParticipant = async (
  offerId: string,
  participantId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/offers/${encodeURIComponent(offerId)}/participants/${encodeURIComponent(participantId)}`,
    signal,
  });

export const useRemoveOfferParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; participantId: string }) =>
      removeOfferParticipant(vars.offerId, vars.participantId),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/review-flags/{flagId}/approval */
export const approveOfferReviewFlag = async (
  offerId: string,
  flagId: string,
  body: OffersResolveOfferReviewFlagRequest,
  signal?: AbortSignal,
): Promise<OffersUnderwritingReviewFlagResponse> =>
  apiRequest<OffersUnderwritingReviewFlagResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/review-flags/${encodeURIComponent(flagId)}/approval`,
    body,
    signal,
  });

export const useApproveOfferReviewFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      flagId: string;
      body: OffersResolveOfferReviewFlagRequest;
    }) => approveOfferReviewFlag(vars.offerId, vars.flagId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/review-flags/{flagId}/rejection */
export const rejectOfferReviewFlag = async (
  offerId: string,
  flagId: string,
  body: OffersResolveOfferReviewFlagRequest,
  signal?: AbortSignal,
): Promise<OffersUnderwritingReviewFlagResponse> =>
  apiRequest<OffersUnderwritingReviewFlagResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/review-flags/${encodeURIComponent(flagId)}/rejection`,
    body,
    signal,
  });

export const useRejectOfferReviewFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      flagId: string;
      body: OffersResolveOfferReviewFlagRequest;
    }) => rejectOfferReviewFlag(vars.offerId, vars.flagId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/document-requirements/{requirementId}/acceptance */
export const acceptOfferDocument = async (
  offerId: string,
  requirementId: string,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDocumentRequirementResponse> =>
  apiRequest<OffersUnderwritingDocumentRequirementResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/document-requirements/${encodeURIComponent(requirementId)}/acceptance`,
    signal,
  });

export const useAcceptOfferDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; requirementId: string }) =>
      acceptOfferDocument(vars.offerId, vars.requirementId),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/document-requirements/{requirementId}/refusal */
export const refuseOfferDocument = async (
  offerId: string,
  requirementId: string,
  body: OffersRefuseOfferDocumentRequest,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDocumentRequirementResponse> =>
  apiRequest<OffersUnderwritingDocumentRequirementResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/document-requirements/${encodeURIComponent(requirementId)}/refusal`,
    body,
    signal,
  });

export const useRefuseOfferDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      requirementId: string;
      body: OffersRefuseOfferDocumentRequest;
    }) => refuseOfferDocument(vars.offerId, vars.requirementId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/document-requirements/{requirementId}/submission */
export const submitOfferDocument = async (
  offerId: string,
  requirementId: string,
  body: OffersSubmitOfferDocumentRequest,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDocumentRequirementResponse> =>
  apiRequest<OffersUnderwritingDocumentRequirementResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/document-requirements/${encodeURIComponent(requirementId)}/submission`,
    body,
    signal,
  });

export const useSubmitOfferDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      requirementId: string;
      body: OffersSubmitOfferDocumentRequest;
    }) => submitOfferDocument(vars.offerId, vars.requirementId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/document-requirements/{requirementId}/waiver */
export const waiveOfferDocument = async (
  offerId: string,
  requirementId: string,
  body: OffersWaiveOfferDocumentRequest,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDocumentRequirementResponse> =>
  apiRequest<OffersUnderwritingDocumentRequirementResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/document-requirements/${encodeURIComponent(requirementId)}/waiver`,
    body,
    signal,
  });

export const useWaiveOfferDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      offerId: string;
      requirementId: string;
      body: OffersWaiveOfferDocumentRequest;
    }) => waiveOfferDocument(vars.offerId, vars.requirementId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/discount-requests/{requestId}/approval */
export const approveOfferDiscount = async (
  offerId: string,
  requestId: string,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDiscountRequestResponse> =>
  apiRequest<OffersUnderwritingDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/discount-requests/${encodeURIComponent(requestId)}/approval`,
    signal,
  });

export const useApproveOfferDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; requestId: string }) =>
      approveOfferDiscount(vars.offerId, vars.requestId),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/discount-requests/{requestId}/rejection */
export const rejectOfferDiscount = async (
  offerId: string,
  requestId: string,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDiscountRequestResponse> =>
  apiRequest<OffersUnderwritingDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/discount-requests/${encodeURIComponent(requestId)}/rejection`,
    signal,
  });

export const useRejectOfferDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; requestId: string }) =>
      rejectOfferDiscount(vars.offerId, vars.requestId),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

/** POST /api/offers/{offerId}/discount-requests */
export const requestOfferDiscount = async (
  offerId: string,
  body: OffersRequestOfferDiscountRequest,
  signal?: AbortSignal,
): Promise<OffersUnderwritingDiscountRequestResponse> =>
  apiRequest<OffersUnderwritingDiscountRequestResponse>({
    method: "POST",
    path: `/api/offers/${encodeURIComponent(offerId)}/discount-requests`,
    body,
    signal,
  });

export const useRequestOfferDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { offerId: string; body: OffersRequestOfferDiscountRequest }) =>
      requestOfferDiscount(vars.offerId, vars.body),
    onSuccess: (_data, vars) => {
      invalidateOffers(queryClient);
      void queryClient.invalidateQueries({ queryKey: offersKeys.detail(vars.offerId) });
    },
  });
};

export type { OffersOfferListItemResponse };
