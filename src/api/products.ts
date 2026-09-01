import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfProductResponse,
  ProductsAddProductCoverageCurrencyLimitRequest,
  ProductsAddProductCoverageRequest,
  ProductsAddProductDocumentTypeRequest,
  ProductsAddProductPaymentMethodRequest,
  ProductsCreateProductRequest,
  ProductsPolicyPlanType,
  ProductsScheduleBasis,
  ProductsProductCoverageCurrencyLimitResponse,
  ProductsProductCoverageResponse,
  ProductsProductDocumentTypeResponse,
  ProductsProductPaymentMethodResponse,
  ProductsProductResponse,
  ProductsUpdateProductCoverageRequest,
  ProductsUpdateProductRequest,
} from "./types";

export const productsKeys = {
  all: [...apiKeys.all, "products"] as const,
  lists: () => [...productsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...productsKeys.lists(), params ?? {}] as const,
  details: () => [...productsKeys.all, "detail"] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
};

/** POST /api/products/{productId}/coverages */
export const addProductCoverage = async (productId: string, body: ProductsAddProductCoverageRequest, signal?: AbortSignal): Promise<ProductsProductCoverageResponse> =>
  apiRequest<ProductsProductCoverageResponse>({
    method: "POST",
    path: `/api/products/${encodeURIComponent(productId)}/coverages`,
    body,
    signal,
  });

export const useAddProductCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      body: ProductsAddProductCoverageRequest;
    }) =>
      addProductCoverage(vars.productId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** POST /api/products/{productId}/document-types */
export const addProductDocumentType = async (productId: string, body: ProductsAddProductDocumentTypeRequest, signal?: AbortSignal): Promise<ProductsProductDocumentTypeResponse> =>
  apiRequest<ProductsProductDocumentTypeResponse>({
    method: "POST",
    path: `/api/products/${encodeURIComponent(productId)}/document-types`,
    body,
    signal,
  });

export const useAddProductDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      body: ProductsAddProductDocumentTypeRequest;
    }) =>
      addProductDocumentType(vars.productId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** POST /api/products/{productId}/payment-methods */
export const addProductPaymentMethod = async (
  productId: string,
  body: ProductsAddProductPaymentMethodRequest,
  signal?: AbortSignal,
): Promise<ProductsProductPaymentMethodResponse> =>
  apiRequest<ProductsProductPaymentMethodResponse>({
    method: "POST",
    path: `/api/products/${encodeURIComponent(productId)}/payment-methods`,
    body,
    signal,
  });

export const useAddProductPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      body: ProductsAddProductPaymentMethodRequest;
    }) => addProductPaymentMethod(vars.productId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** DELETE /api/products/{productId}/payment-methods/{paymentMethodEntryId} */
export const removeProductPaymentMethod = async (
  productId: string,
  paymentMethodEntryId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/products/${encodeURIComponent(productId)}/payment-methods/${encodeURIComponent(paymentMethodEntryId)}`,
    signal,
  });

export const useRemoveProductPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      paymentMethodEntryId: string;
    }) => removeProductPaymentMethod(vars.productId, vars.paymentMethodEntryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** POST /api/products */
export const createProduct = async (body: ProductsCreateProductRequest, signal?: AbortSignal): Promise<ProductsProductResponse> =>
  apiRequest<ProductsProductResponse>({
    method: "POST",
    path: `/api/products`,
    body,
    signal,
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductsCreateProductRequest) => createProduct(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

export type ListProductsQuery = {
  name?: string;
  productGroupId?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** GET /api/products */
export const listProducts = async (
  query?: ListProductsQuery,
  signal?: AbortSignal
): Promise<PaginationPagedListOfProductResponse> =>
  apiRequest<PaginationPagedListOfProductResponse>({
    method: "GET",
    path: `/api/products`,
    query: query as Record<string, string | number | boolean | null | undefined>,
    signal,
  });

export const useListProducts = (query?: ListProductsQuery, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: productsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: ({ signal }) => listProducts(query, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

/** DELETE /api/products/{id} */
export const deleteProduct = async (id: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/products/${encodeURIComponent(id)}`,
    signal,
  });

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** GET /api/products/{id} */
export const getProduct = async (id: string, signal?: AbortSignal): Promise<ProductsProductResponse> =>
  apiRequest<ProductsProductResponse>({
    method: "GET",
    path: `/api/products/${encodeURIComponent(id)}`,
    signal,
  });

export const useGetProduct = (id: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });

/** PUT /api/products/{id} */
export const updateProduct = async (id: string, body: ProductsUpdateProductRequest, signal?: AbortSignal): Promise<ProductsProductResponse> =>
  apiRequest<ProductsProductResponse>({
    method: "PUT",
    path: `/api/products/${encodeURIComponent(id)}`,
    body,
    signal,
  });

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      body: ProductsUpdateProductRequest;
    }) =>
      updateProduct(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** DELETE /api/products/{productId}/coverages/{coverageEntryId} */
export const removeProductCoverage = async (productId: string, coverageEntryId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/products/${encodeURIComponent(productId)}/coverages/${encodeURIComponent(coverageEntryId)}`,
    signal,
  });

export const useRemoveProductCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      coverageEntryId: string;
    }) =>
      removeProductCoverage(vars.productId, vars.coverageEntryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** PUT /api/products/{productId}/coverages/{coverageEntryId} */
export const updateProductCoverage = async (
  productId: string,
  coverageEntryId: string,
  body: ProductsUpdateProductCoverageRequest,
  signal?: AbortSignal,
): Promise<ProductsProductCoverageResponse> =>
  apiRequest<ProductsProductCoverageResponse>({
    method: "PUT",
    path: `/api/products/${encodeURIComponent(productId)}/coverages/${encodeURIComponent(coverageEntryId)}`,
    body,
    signal,
  });

export const useUpdateProductCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      coverageEntryId: string;
      body: ProductsUpdateProductCoverageRequest;
    }) => updateProductCoverage(vars.productId, vars.coverageEntryId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** PUT /api/products/{productId}/coverages/{coverageEntryId}/currency-limits */
export const addProductCoverageCurrencyLimit = async (
  productId: string,
  coverageEntryId: string,
  body: ProductsAddProductCoverageCurrencyLimitRequest,
  signal?: AbortSignal,
): Promise<ProductsProductCoverageCurrencyLimitResponse> =>
  apiRequest<ProductsProductCoverageCurrencyLimitResponse>({
    method: "PUT",
    path: `/api/products/${encodeURIComponent(productId)}/coverages/${encodeURIComponent(coverageEntryId)}/currency-limits`,
    body,
    signal,
  });

export const useAddProductCoverageCurrencyLimit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      coverageEntryId: string;
      body: ProductsAddProductCoverageCurrencyLimitRequest;
    }) => addProductCoverageCurrencyLimit(vars.productId, vars.coverageEntryId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** DELETE /api/products/{productId}/coverages/{coverageEntryId}/currency-limits/{currencyLimitEntryId} */
export const removeProductCoverageCurrencyLimit = async (
  productId: string,
  coverageEntryId: string,
  currencyLimitEntryId: string,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/products/${encodeURIComponent(productId)}/coverages/${encodeURIComponent(coverageEntryId)}/currency-limits/${encodeURIComponent(currencyLimitEntryId)}`,
    signal,
  });

export const useRemoveProductCoverageCurrencyLimit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      coverageEntryId: string;
      currencyLimitEntryId: string;
    }) =>
      removeProductCoverageCurrencyLimit(
        vars.productId,
        vars.coverageEntryId,
        vars.currencyLimitEntryId,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** DELETE /api/products/{productId}/document-types/{documentTypeEntryId} */
export const removeProductDocumentType = async (productId: string, documentTypeEntryId: string, signal?: AbortSignal): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/products/${encodeURIComponent(productId)}/document-types/${encodeURIComponent(documentTypeEntryId)}`,
    signal,
  });

export const useRemoveProductDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      documentTypeEntryId: string;
    }) =>
      removeProductDocumentType(vars.productId, vars.documentTypeEntryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** UI-facing shape with safe defaults for fields the API does not return yet. */
export type MappedProduct = {
  id: string;
  name: string;
  code: string;
  status: "Draft" | "Active" | "Inactive";
  currencies: string[];
  activeVersion: string;
  createdDate: string;
  type: string;
  description: string;
  requiredDocuments: string[];
  flags: {
    pep: boolean;
    highInsuredAmount: boolean;
    totalExposure: boolean;
    manualUnderwriting: boolean;
    compliance: boolean;
  };
  agentCommission: number;
  bankCommission: number;
  bankPartnerCode: string;
  productGroupId?: string;
  coverageText?: string;
  defaultPrintableTemplateDocumentId?: string | null;
  policyPlanType?: ProductsPolicyPlanType | null;
  issuanceMode?: string | null;
  calculationMethod?: string | null;
  scheduleBasis?: ProductsScheduleBasis | null;
  maxCoveredYears?: number | null;
  paymentModel?: string;
  premiumTableId?: string;
  coverages?: ProductsProductCoverageResponse[];
  productDocumentTypes?: ProductsProductDocumentTypeResponse[];
  paymentMethods?: ProductsProductPaymentMethodResponse[];
  setupDetails?: {
    legacyPacketId: number;
    bankPartnerCode: string;
    policyType: string;
    insuranceAmountType: string;
    legacyTariffId: number;
    maxTenorMonths: number;
    isObsolete: boolean;
    apiSubject: boolean;
    apiStraight: boolean;
  };
  paymentDetails?: {
    premiumPaymentType: string;
    packetPaymentType: string;
    renewalType: string;
  };
  loanDetails?: {
    packetLoanType: string;
    loanProductType: string;
  };
  internalDetails?: {
    coveragePrintableText: string;
    packetFinType: number | null;
  };
  externalDetails?: {
    sapProductCode: string;
    sapChannelCode: string;
    f5ProductCode: string;
    actuarialProductCode: string;
  };
};

export const mapApiProduct = (p: ProductsProductResponse): MappedProduct => {
  const statusRaw = p.status?.trim();
  const status =
    statusRaw === "Active" || statusRaw === "Inactive" || statusRaw === "Draft"
      ? statusRaw
      : "Draft";

  return {
    id: p.id ?? "",
    name: p.name ?? "—",
    code: p.code?.trim() || p.id || "—",
    status,
    currencies: p.supportedCurrencies ?? [],
    activeVersion: p.activeVersion?.trim() || "—",
    createdDate: p.createdDate?.trim() || "—",
    type: p.type?.trim() || "Life Insurance",
    description: p.description?.trim() || p.coverageText?.trim() || "",
    requiredDocuments: p.requiredDocuments ?? [],
    flags: {
      pep: p.flags?.pep ?? false,
      highInsuredAmount: p.flags?.highInsuredAmount ?? false,
      totalExposure: p.flags?.totalExposure ?? false,
      manualUnderwriting: p.flags?.manualUnderwriting ?? false,
      compliance: p.flags?.compliance ?? false,
    },
    agentCommission: p.agentCommission ?? 0,
    bankCommission: p.bankCommission ?? 0,
    bankPartnerCode: p.bankPartnerCode?.trim() || "—",
    productGroupId: p.productGroupId,
    coverageText: p.coverageText,
    defaultPrintableTemplateDocumentId: p.defaultPrintableTemplateDocumentId ?? null,
    policyPlanType: p.policyPlanType ?? null,
    issuanceMode: p.issuanceMode ?? null,
    calculationMethod: p.calculationMethod ?? null,
    scheduleBasis: p.scheduleBasis ?? null,
    maxCoveredYears: p.maxCoveredYears ?? null,
    paymentModel: p.paymentModel ?? undefined,
    premiumTableId: p.premiumTableId ?? undefined,
    coverages: p.coverages,
    productDocumentTypes: p.productDocumentTypes,
    paymentMethods: p.paymentMethods,
    setupDetails: {
      legacyPacketId: 0,
      bankPartnerCode: p.bankPartnerCode?.trim() || "—",
      policyType: "—",
      insuranceAmountType: "—",
      legacyTariffId: 0,
      maxTenorMonths: 0,
      isObsolete: false,
      apiSubject: false,
      apiStraight: false,
    },
    paymentDetails: {
      premiumPaymentType: "—",
      packetPaymentType: "—",
      renewalType: "—",
    },
    loanDetails: {
      packetLoanType: "—",
      loanProductType: "—",
    },
    internalDetails: {
      coveragePrintableText: p.coverageText ?? "",
      packetFinType: null,
    },
    externalDetails: {
      sapProductCode: "—",
      sapChannelCode: "—",
      f5ProductCode: "—",
      actuarialProductCode: "—",
    },
  };
};
