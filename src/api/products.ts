import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type {
  PaginationPagedListOfProductResponse,
  ProductsActuarialCode,
  ProductsAddProductCoverageCurrencyLimitRequest,
  ProductsAddProductCoverageRequest,
  ProductsAddProductDocumentTypeRequest,
  ProductsAddProductBankAccountRequest,
  ProductsCreateProductRequest,
  ProductsCurrencyLimitType,
  ProductsDocumentRequirementStage,
  ProductsDocumentReusePolicy,
  ProductsPolicyPlanRules,
  ProductsPolicyPlanType,
  ProductsProductCoverageCurrencyLimitResponse,
  ProductsProductCoverageResponse,
  ProductsProductDocumentTypeResponse,
  ProductsProductBankAccountResponse,
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

export const buildAddProductBankAccountBody = (
  bankAccountId: string,
): ProductsAddProductBankAccountRequest => ({ bankAccountId });

export const buildAddProductCoverageBody = (input: {
  coverageId: string;
  ratingTableId: string;
  ratingTableMultiplier?: number;
  isMandatory?: boolean;
  isSumInsuredFixed?: boolean;
  sumInsuredPercentage?: number;
}): ProductsAddProductCoverageRequest => {
  const isSumInsuredFixed = input.isSumInsuredFixed ?? true;
  return {
    coverageId: input.coverageId,
    ratingTableId: input.ratingTableId,
    ratingTableMultiplier: input.ratingTableMultiplier ?? 1,
    isMandatory: input.isMandatory ?? true,
    isSumInsuredFixed,
    ...(!isSumInsuredFixed && input.sumInsuredPercentage != null
      ? { sumInsuredPercentage: input.sumInsuredPercentage }
      : {}),
  };
};

export const buildAddProductCoverageCurrencyLimitBody = (input: {
  currency: string;
  type: ProductsCurrencyLimitType;
  value: number;
}): ProductsAddProductCoverageCurrencyLimitRequest => ({
  currency: input.currency,
  type: input.type,
  value: input.value,
});

export const buildAddProductDocumentTypeBody = (input: {
  documentTypeId: string;
  alwaysRequired: boolean;
  insuredAmountOver?: number | null;
  insuredAmountCurrency?: string | null;
  totalExposureOver?: number | null;
  totalExposureCurrency?: string | null;
  ageOver?: number | null;
  isPep?: boolean | null;
  isForeignCitizen?: boolean | null;
  stages?: ProductsDocumentRequirementStage;
  reusePolicy?: ProductsDocumentReusePolicy;
}): ProductsAddProductDocumentTypeRequest => {
  const insuredAmountOver = input.insuredAmountOver ?? null;
  const totalExposureOver = input.totalExposureOver ?? null;
  return {
    documentTypeId: input.documentTypeId,
    alwaysRequired: input.alwaysRequired,
    insuredAmountOver,
    insuredAmountCurrency: insuredAmountOver != null ? (input.insuredAmountCurrency || null) : null,
    totalExposureOver,
    totalExposureCurrency: totalExposureOver != null ? (input.totalExposureCurrency || null) : null,
    ageOver: input.ageOver ?? null,
    isPep: input.isPep ?? false,
    isForeignCitizen: input.isForeignCitizen ?? false,
    stages: input.stages && input.stages !== "none" ? input.stages : "initialOffer",
    reusePolicy: input.reusePolicy ?? "requireNewSubmission",
  };
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

/** POST /api/products/{productId}/bank-accounts */
export const addProductBankAccount = async (
  productId: string,
  body: ProductsAddProductBankAccountRequest,
  signal?: AbortSignal,
): Promise<ProductsProductBankAccountResponse> =>
  apiRequest<ProductsProductBankAccountResponse>({
    method: "POST",
    path: `/api/products/${encodeURIComponent(productId)}/bank-accounts`,
    body,
    signal,
  });

export const useAddProductBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      body: ProductsAddProductBankAccountRequest;
    }) => addProductBankAccount(vars.productId, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
};

/** DELETE /api/products/{productId}/bank-accounts/{productBankAccountId} */
export const removeProductBankAccount = async (
  productId: string,
  productBankAccountId: string | number,
  signal?: AbortSignal,
): Promise<void> =>
  apiRequest<void>({
    method: "DELETE",
    path: `/api/products/${encodeURIComponent(productId)}/bank-accounts/${encodeURIComponent(String(productBankAccountId))}`,
    signal,
  });

export const useRemoveProductBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      productId: string;
      productBankAccountId: string | number;
    }) => removeProductBankAccount(vars.productId, vars.productBankAccountId),
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

/** UI-facing product with defaults for optional API fields. */
export type MappedProduct = {
  id: string;
  name: string;
  currencies: string[];
  productGroupId?: string;
  coverageText?: string;
  defaultPrintableTemplateDocumentId?: string | null;
  defaultTermsTemplateDocumentId?: string | null;
  policyPlanType?: ProductsPolicyPlanType | null;
  planRules?: ProductsPolicyPlanRules;
  maximumCoverageTermMonths?: number | null;
  /** Whole years implied by `maximumCoverageTermMonths` (for offer term capping). */
  maxCoveredYears?: number | null;
  actuarialCode?: ProductsActuarialCode | null;
  sapProductCode?: string | null;
  sapChannelCode?: string | null;
  f5ProductCode?: string | null;
  requiresLoanBalances?: boolean;
  coverages?: ProductsProductCoverageResponse[];
  productDocumentTypes?: ProductsProductDocumentTypeResponse[];
  bankAccounts?: ProductsProductBankAccountResponse[];
};

export const mapApiProduct = (p: ProductsProductResponse): MappedProduct => ({
  id: p.id ?? "",
  name: p.name ?? "—",
  currencies: p.supportedCurrencies ?? [],
  productGroupId: p.productGroupId,
  coverageText: p.coverageText,
  defaultPrintableTemplateDocumentId: p.defaultPrintableTemplateDocumentId ?? null,
  defaultTermsTemplateDocumentId: p.defaultTermsTemplateDocumentId ?? null,
  policyPlanType: p.policyPlanType ?? null,
  planRules: p.planRules,
  maximumCoverageTermMonths: p.maximumCoverageTermMonths ?? null,
  maxCoveredYears:
    p.maximumCoverageTermMonths != null && p.maximumCoverageTermMonths > 0
      ? Math.max(1, Math.floor(p.maximumCoverageTermMonths / 12))
      : null,
  actuarialCode: p.actuarialCode ?? null,
  sapProductCode: p.sapProductCode ?? null,
  sapChannelCode: p.sapChannelCode ?? null,
  f5ProductCode: p.f5ProductCode ?? null,
  requiresLoanBalances: p.requiresLoanBalances ?? false,
  coverages: p.coverages,
  productDocumentTypes: p.productDocumentTypes,
  bankAccounts: p.bankAccounts,
});
