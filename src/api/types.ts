/** Types derived from ESIG Life API OpenAPI schema. */

export type Ulid = string;

export type DomainCommonGender = "male" | "female";

export type RatingTablesRateResponse = {
  isFlat?: boolean;
  flatValue?: number | null;
  flatValueCurrency?: string | null;
  percentageValue?: number | null;
};

export type RatingTablesRatingTableRuleResponse = {
  id?: number;
  minAge?: number;
  maxAge?: number;
  gender?: DomainCommonGender;
  rate?: RatingTablesRateResponse;
};

export type RatingTablesAddRatingTableRuleRequest = {
  minAge?: number;
  maxAge?: number;
  gender?: DomainCommonGender;
  isFlat?: boolean;
  flatValue: number;
  flatValueCurrency: string;
  percentageValue: number;
};

export type FastEndpointsErrorResponse = {
  statusCode?: number;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
};

export type RatingTablesRatingTableResponse = {
  id?: string;
  name?: string;
  rules?: RatingTablesRatingTableRuleResponse[];
};

export type RatingTablesCreateRatingTableRequest = {
  name: string;
};

export type RatingTablesDeleteRatingTableRequest = Record<string, unknown>;

export type RatingTablesGetRatingTableRequest = Record<string, unknown>;

export type PaginationPagedListOfRatingTableResponse = {
  items?: RatingTablesRatingTableResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type PaginationPagedRequest = Record<string, unknown>;

export type RatingTablesListRatingTablesRequest = PaginationPagedRequest & Record<string, unknown>;

export type RatingTablesRemoveRatingTableRuleRequest = Record<string, unknown>;

export type RatingTablesUpdateRatingTableRequest = {
  name: string;
};

export type ProductsProductCoverageCurrencyLimitResponse = {
  id?: string | number;
  currency?: string;
  type?: string;
  value?: number;
};

export type ProductsProductCoverageResponse = {
  id?: number;
  coverageId?: string;
  ratingTableId?: string;
  ratingTableMultiplier?: number;
  isMandatory?: boolean;
  isSumInsuredFixed?: boolean;
  sumInsuredPercentage?: number;
  sortOrder?: number;
  currencyLimits?: ProductsProductCoverageCurrencyLimitResponse[];
};

export type ProductsAddProductCoverageRequest = {
  coverageId?: string;
  ratingTableId?: string;
  ratingTableMultiplier?: number;
  isMandatory?: boolean;
  isSumInsuredFixed?: boolean;
  sumInsuredPercentage?: number;
};

export type ProductsUpdateProductCoverageRequest = ProductsAddProductCoverageRequest;

export type ProductsAddProductCoverageCurrencyLimitRequest = {
  currency: string;
  type: string;
  value: number;
};

export type ProductsCurrencyLimitType =
  | "fixedSumInsuredAmount"
  | "minimumPremium"
  | "yearlyLimit"
  | "aggregateLimit";

export type ProductsProductDocumentTypeRequiredForResponse = {
  insuredAmountOver?: number | null;
  totalExposureOver?: number | null;
  ageOver?: number | null;
  isPep?: boolean | null;
  alwaysRequired?: boolean;
};

export type ProductsProductDocumentTypeResponse = {
  id?: number;
  documentTypeId?: string;
  requiredFor?: ProductsProductDocumentTypeRequiredForResponse;
};

export type ProductsAddProductDocumentTypeRequest = {
  documentTypeId?: string;
  alwaysRequired?: boolean;
  insuredAmountOver?: number | null;
  totalExposureOver?: number | null;
  ageOver?: number | null;
  isPep?: boolean | null;
};

export type ProductsAddProductPaymentMethodRequest = {
  bankAccountId?: string;
};

export type ProductsProductPaymentMethodResponse = {
  id?: string | number;
  bankAccountId?: string;
  currency?: string;
};

export type ProductsProductResponse = {
  id?: string;
  name?: string;
  coverageText?: string;
  productGroupId?: string;
  supportedCurrencies?: string[];
  policyPlanType?: ProductsPolicyPlanType | null;
  /** Derived from `policyPlanType`. */
  issuanceMode?: string | null;
  /** Derived from `policyPlanType`. */
  calculationMethod?: string | null;
  /** Read-only, derived from `policyPlanType`. Omitted for Upfront/PPI/NA plans. */
  scheduleBasis?: ProductsScheduleBasis | null;
  maxCoveredYears?: number | null;
  coverages?: ProductsProductCoverageResponse[];
  productDocumentTypes?: ProductsProductDocumentTypeResponse[];
  paymentMethods?: ProductsProductPaymentMethodResponse[];
  defaultPrintableTemplateDocumentId?: string | null;
  /** Not yet returned by API — will be added later. */
  code?: string | null;
  status?: string | null;
  description?: string | null;
  type?: string | null;
  activeVersion?: string | null;
  createdDate?: string | null;
  bankPartnerCode?: string | null;
  agentCommission?: number | null;
  bankCommission?: number | null;
  paymentModel?: string | null;
  premiumTableId?: string | null;
  requiredDocuments?: string[] | null;
  flags?: {
    pep?: boolean;
    highInsuredAmount?: boolean;
    totalExposure?: boolean;
    manualUnderwriting?: boolean;
    compliance?: boolean;
  } | null;
};

export type ProductsIssuanceMode = "annualRenewable" | "wholeOfTerm";
export type ProductsCalculationMethod = "declining" | "leveled";

/** Product classification. Replaces the former `premiumPlan` + `sumInsuredBasis` pair. */
export type ProductsPolicyPlanType =
  | "PPR-SIB"
  | "PPR-STB"
  | "PGP"
  | "PPRS"
  | "PPFM"
  | "PPFV"
  | "NA";

export type ProductsScheduleBasis = "tabled" | "perRenewalInfo";

export type ProductsCreateProductRequest = {
  name: string;
  productGroupId?: string;
  supportedCurrencies: string[];
  coverageText?: string;
  defaultPrintableTemplateDocumentId?: string | null;
  policyPlanType?: ProductsPolicyPlanType | null;
  maxCoveredYears?: number | null;
  /** Not yet accepted by API — will be added later. */
  code?: string;
  status?: string;
  description?: string;
  bankPartnerCode?: string;
};

export type ProductsDeleteProductRequest = Record<string, unknown>;

export type ProductsGetProductRequest = Record<string, unknown>;

export type PaginationPagedListOfProductResponse = {
  items?: ProductsProductResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type ProductsListProductsRequest = PaginationPagedRequest & Record<string, unknown>;

export type ProductsRemoveProductCoverageRequest = Record<string, unknown>;

export type ProductsRemoveProductDocumentTypeRequest = Record<string, unknown>;

export type ProductsRemoveProductPaymentMethodRequest = Record<string, unknown>;

export type ProductsUpdateProductRequest = {
  name: string;
  supportedCurrencies: string[];
  coverageText?: string;
  defaultPrintableTemplateDocumentId?: string | null;
  policyPlanType?: ProductsPolicyPlanType | null;
  maxCoveredYears?: number | null;
  /** Not yet accepted by API — will be added later. */
  code?: string;
  status?: string;
  description?: string;
  productGroupId?: string;
  bankPartnerCode?: string;
};

export type ProductGroupsProductGroupResponse = {
  id?: string;
  name?: string;
  /** Not yet returned by API — will be added later. */
  code?: string | null;
  /** Albanian label — not yet returned by API. */
  label?: string | null;
  /** English display name — not yet returned by API (use `name` until then). */
  english?: string | null;
};

export type ProductGroupsCreateProductGroupRequest = {
  name: string;
  /** Not yet accepted by API — will be added later. */
  code?: string;
  label?: string;
  english?: string;
};

export type ProductGroupsDeleteProductGroupRequest = Record<string, unknown>;

export type ProductGroupsGetProductGroupRequest = Record<string, unknown>;

export type PaginationPagedListOfProductGroupResponse = {
  items?: ProductGroupsProductGroupResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type ProductGroupsListProductGroupsRequest = PaginationPagedRequest & Record<string, unknown>;

export type ProductGroupsUpdateProductGroupRequest = {
  name: string;
  /** Not yet accepted by API — will be added later. */
  code?: string;
  label?: string;
  english?: string;
};

export type CoveragesCoverageResponse = {
  id?: string;
  name?: string;
  description?: string;
};

export type CoveragesCreateCoverageRequest = {
  name: string;
  description?: string;
};

export type CoveragesDeleteCoverageRequest = Record<string, unknown>;

export type CoveragesGetCoverageRequest = Record<string, unknown>;

export type PaginationPagedListOfCoverageResponse = {
  items?: CoveragesCoverageResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type CoveragesListCoveragesRequest = PaginationPagedRequest & Record<string, unknown>;

export type CoveragesUpdateCoverageRequest = {
  name: string;
  description?: string;
};

export type DomainOffersParticipantRole = "policyHolder" | "invoiced" | "beneficiary";

export type DomainPartiesEnumsPartyType = "person" | "company";

export type PoliciesPolicyParticipantResponse = {
  id?: number;
  partyId?: string;
  role?: DomainOffersParticipantRole;
  partyType?: DomainPartiesEnumsPartyType;
  uniqueIdentifier?: string;
  displayName?: string;
  countryCode?: string;
  isLeader?: boolean;
  share?: number | null;
};

export type PoliciesPolicyInsuredPersonResponse = {
  id?: number;
  personId?: string;
  personalIdentifier?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
};

export type PoliciesPolicyDocumentResponse = {
  id?: number;
  documentId?: string;
  documentTypeId?: string;
};

export type PoliciesPolicyCoverageResponse = {
  id?: number;
  coverageId?: string;
  coverageName?: string;
  coverageDescription?: string;
  sumInsured?: number;
  rateUsed?: RatingTablesRateResponse;
  ratingTableMultiplierUsed?: number;
  calculatedPremium?: number;
};

export type PoliciesPolicyYearResponse = {
  id?: number;
  year?: number;
  period?: OffersDateOnlyRangeResponse;
  insuredAmount?: number;
  /** Actuarially-calculated premium. */
  premium?: number;
  /** Amount actually billed. Equals `premium` except on PPFM/PPFV plans, where it is leveled. */
  payPremium?: number;
  coverages?: PoliciesPolicyCoverageResponse[];
};

export type PoliciesPolicyResponse = {
  id?: string;
  productId?: string;
  currency?: string;
  offerId?: string;
  /** Snapshotted from the product at issuance. */
  policyPlanType?: ProductsPolicyPlanType | null;
  issuedOnUtc?: string;
  effectiveFromUtc?: string;
  effectiveToUtc?: string;
  coverageText?: string;
  printableTemplateDocumentId?: string;
  participants?: PoliciesPolicyParticipantResponse[];
  insuredPersons?: PoliciesPolicyInsuredPersonResponse[];
  documents?: PoliciesPolicyDocumentResponse[];
  policyYears?: PoliciesPolicyYearResponse[];
};

export type PoliciesGetPolicyRequest = Record<string, unknown>;

export type PoliciesIssuePolicyRequest = {
  printableTemplateDocumentId?: string;
};

export type PaginationPagedListOfPolicyResponse = {
  items?: PoliciesPolicyResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type PoliciesListPoliciesRequest = PaginationPagedRequest & Record<string, unknown>;

export type SmartEnumsEnumItem = {
  value: string;
  text: string;
};

export type PeoplePersonResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  personalIdentifier?: string;
  countryCode?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
};

export type PeopleCreatePersonRequest = {
  firstName: string;
  lastName: string;
  personalIdentifier: string;
  countryCode: string;
  nationality: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
};

export type PeopleGetPersonRequest = Record<string, unknown>;

export type PaginationPagedListOfPersonResponse = {
  items?: PeoplePersonResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type PeopleListPeopleRequest = PaginationPagedRequest & Record<string, unknown>;

export type PeopleUpdatePersonRequest = {
  firstName: string;
  lastName: string;
  personalIdentifier: string;
  countryCode: string;
  nationality: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
};

export type CompaniesCompanyAddressResponse = {
  id?: number;
  street?: string;
  city?: string;
  postalCode?: string | null;
  countryCode?: string;
  isMain?: boolean;
};

export type CompaniesAddCompanyAddressRequest = {
  street: string;
  city: string;
  countryCode: string;
  isMain?: boolean;
  postalCode?: string | null;
};

export type DomainPartiesEnumsCompanyType = "soleProprietor" | "shpk" | "sha" | "publicInstitution" | "municipality" | "association" | "foundation" | "branchOfForeignCompany" | "other";

export type CompaniesCompanyResponse = {
  id?: string;
  legalName?: string;
  tradeName?: string | null;
  registrationNumber?: string;
  countryCode?: string;
  nationality?: string;
  companyType?: DomainPartiesEnumsCompanyType;
  addresses?: CompaniesCompanyAddressResponse[];
};

export type CompaniesCreateCompanyRequest = {
  legalName: string;
  tradeName?: string | null;
  registrationNumber: string;
  countryCode: string;
  nationality: string;
  companyType?: DomainPartiesEnumsCompanyType;
};

export type CompaniesGetCompanyRequest = Record<string, unknown>;

export type PaginationPagedListOfCompanyResponse = {
  items?: CompaniesCompanyResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type CompaniesListCompaniesRequest = PaginationPagedRequest & Record<string, unknown>;

export type CompaniesRemoveCompanyAddressRequest = Record<string, unknown>;

export type CompaniesUpdateCompanyRequest = {
  legalName: string;
  tradeName?: string | null;
  registrationNumber: string;
  countryCode: string;
  nationality: string;
  companyType?: DomainPartiesEnumsCompanyType;
};

export type OffersOfferInsuredPersonResponse = {
  id?: number;
  personId?: string;
  personalIdentifier?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
};

export type OffersAddOfferInsuredPersonRequest = {
  personId?: string;
};

export type OffersDateOnlyRangeResponse = {
  startDate?: string;
  endDate?: string;
};

export type OffersOfferLoanDisbursementResponse = {
  id?: number;
  year?: number;
  period?: OffersDateOnlyRangeResponse;
  remainingLoanAmount?: number;
};

export type OffersAddOfferLoanDisbursementRequest = {
  year?: number;
  periodStart?: string;
  periodEnd?: string;
  remainingLoanAmount?: number;
};

export type OffersOfferParticipantResponse = {
  id?: number;
  partyId?: string;
  role?: DomainOffersParticipantRole;
  partyType?: DomainPartiesEnumsPartyType;
  uniqueIdentifier?: string;
  displayName?: string;
  countryCode?: string;
  isLeader?: boolean;
  share?: number | null;
};

export type OffersAddOfferParticipantRequest = {
  partyId?: string;
  partyType?: DomainPartiesEnumsPartyType;
  role?: DomainOffersParticipantRole;
  isLeader?: boolean;
  share?: number | null;
};

export type DomainOffersInternalOfferYearStatus = "draft" | "pending" | "active" | "cancelled";

export type OffersOfferYearCoverageResponse = {
  id?: number;
  coverageId?: string;
  sumInsured?: number;
  rateUsed?: RatingTablesRateResponse;
  ratingTableMultiplierUsed?: number;
  calculatedPremium?: number;
};

export type DomainOffersOfferYearDocumentStatus = "required" | "submitted" | "accepted" | "refused";

export type OffersOfferYearDocumentResponse = {
  id?: number;
  documentId?: string | null;
  documentTypeId?: string;
  status?: DomainOffersOfferYearDocumentStatus;
  refusalReason?: string | null;
};

export type DomainOffersOfferYearDiscountRequestStatus = "requested" | "approved" | "rejected";

export type OffersOfferYearDiscountRequestResponse = {
  id?: number;
  requestedDiscountPercentage?: number;
  reason?: string;
  status?: DomainOffersOfferYearDiscountRequestStatus;
};

export type DomainOffersOfferYearReviewFlagStatus = "pending" | "approved" | "rejected";

export type OffersOfferYearReviewFlagResponse = {
  id?: number;
  type?: string;
  reason?: string;
  status?: DomainOffersOfferYearReviewFlagStatus | string;
  raisedOnUtc?: string;
  resolvedOnUtc?: string | null;
};

export type OffersOfferYearResponse = {
  id?: number;
  year?: number;
  period?: OffersDateOnlyRangeResponse;
  insuredAmount?: number;
  /** Actuarially-calculated premium. */
  premium?: number;
  /** Amount actually billed. Equals `premium` except on PPFM/PPFV plans, where it is leveled. */
  payPremium?: number;
  internalStatus?: DomainOffersInternalOfferYearStatus;
  policyId?: string | null;
  coverages?: OffersOfferYearCoverageResponse[];
  documents?: OffersOfferYearDocumentResponse[];
  discountRequests?: OffersOfferYearDiscountRequestResponse[];
  reviewFlags?: OffersOfferYearReviewFlagResponse[];
};

/** Slim shape used by POST /offers/{offerId}/premium and POST /offers/premium preview UI. */
export type OffersOfferPremiumPreview = {
  year?: number;
  insuredAmount: number;
  premium: number;
  payPremium: number;
};

/** POST /api/offers/premium — unbound premium calc from product + insured + loan rows. */
export type OffersCalculatePremiumRequest = {
  productId: string;
  currency: string;
  dateOfBirth: string;
  gender: DomainCommonGender;
  loanDisbursements: OffersAddOfferLoanDisbursementRequest[];
};

export type OffersApproveOfferYearDiscountRequest = Record<string, unknown>;

export type OffersApproveOfferYearDocumentRequest = Record<string, unknown>;

export type OffersApproveOfferYearReviewFlagRequest = Record<string, unknown>;

export type DomainOffersOfferStatus = "draft" | "quoted" | "partiallyBound" | "bound" | "cancelled" | "expired";

export type OffersOfferResponse = {
  id?: string;
  productId?: string;
  currency?: string;
  status?: DomainOffersOfferStatus;
  createdOnUtc?: string;
  participants?: OffersOfferParticipantResponse[];
  insuredPersons?: OffersOfferInsuredPersonResponse[];
  loanDisbursements?: OffersOfferLoanDisbursementResponse[];
  offerYears?: OffersOfferYearResponse[];
};

/** Item of GET /api/offers/renewals-due. */
export type OffersRenewalDueResponse = {
  offerId?: string;
  productId?: string;
  nextYear?: number;
  /** true → next year is already priced, go straight to POST /offers/{offerId}/renewal. */
  readyToRenew?: boolean;
  currentPolicyEffectiveToUtc?: string;
};

export type PaginationPagedListOfRenewalDueResponse = {
  items?: OffersRenewalDueResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type OffersListRenewalsDueRequest = PaginationPagedRequest & Record<string, unknown>;

export type OffersCalculateOfferYearsRequest = Record<string, unknown>;

export type OffersCancelOfferRequest = Record<string, unknown>;

/** PUT /api/offers/{offerId}/years/{year}/overwrite */
export type OffersOverwriteOfferYearRequest = {
  offerId: string;
  year: number;
  insuredAmount: number;
  premium: number;
  /** Required. Defaults to `premium` on every plan except PPFM/PPFV. */
  payPremium: number;
};

export type OffersCancelOfferYearRequest = Record<string, unknown>;

export type OffersCreateOfferRequest = {
  productId?: string;
  currency: string;
};

export type OffersGetOfferRequest = Record<string, unknown>;

export type OffersListOfferYearDocumentsRequest = Record<string, unknown>;

export type PaginationPagedListOfOfferResponse = {
  items?: OffersOfferResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type OffersListOffersRequest = PaginationPagedRequest & Record<string, unknown>;

export type OffersRejectOfferYearDiscountRequest = Record<string, unknown>;

export type OffersRejectOfferYearDocumentRequest = {
  reason: string;
};

export type OffersRejectOfferYearReviewFlagRequest = Record<string, unknown>;

export type OffersRemoveOfferInsuredPersonRequest = Record<string, unknown>;

export type OffersRemoveOfferLoanDisbursementRequest = Record<string, unknown>;

export type OffersRemoveOfferParticipantRequest = Record<string, unknown>;

export type OffersRequestOfferYearDiscountRequest = {
  requestedDiscountPercentage?: number;
  reason: string;
};

export type OffersSubmitOfferYearDocumentRequest = {
  documentId?: string;
};

export type DocumentsDocumentTypesDocumentTypeResponse = {
  id?: string;
  name?: string;
  description?: string;
  templateDocumentId?: string | null;
};

export type DocumentsDocumentTypesCreateDocumentTypeRequest = {
  name: string;
  description: string;
  templateDocumentId?: string | null;
};

export type DocumentsDocumentTypesDeleteDocumentTypeRequest = Record<string, unknown>;

export type DocumentsDocumentTypesGetDocumentTypeRequest = Record<string, unknown>;

export type PaginationPagedListOfDocumentTypeResponse = {
  items?: DocumentsDocumentTypesDocumentTypeResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type DocumentsDocumentTypesListDocumentTypesRequest = PaginationPagedRequest & {
  name?: string;
  hasTemplate?: boolean;
};

export type DocumentsDocumentTypesUpdateDocumentTypeRequest = {
  name: string;
  description: string;
  templateDocumentId?: string | null;
};

export type DomainDocumentsDocumentStorageProvider = "localFileSystem" | "minio" | "s3" | "azureBlob";

export type DocumentsDocumentResponse = {
  id?: string;
  originalFileName?: string;
  storedFileName?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256Hash?: string;
  storageProvider?: DomainDocumentsDocumentStorageProvider;
  createdOn?: string;
  deletedOn?: string | null;
};

export type DocumentsCreateDocumentRequest = {
  file: string;
};

export type DocumentsDeleteDocumentRequest = Record<string, unknown>;

export type DocumentsGetDocumentRequest = Record<string, unknown>;

export type DocumentsGetDocumentFileRequest = Record<string, unknown>;

export type PaginationPagedListOfDocumentResponse = {
  items?: DocumentsDocumentResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type DocumentsListDocumentsRequest = PaginationPagedRequest & {
  createdFromUtc?: string;
  createdToUtc?: string;
  isDeleted?: boolean;
  originalFileName?: string;
};

export type DocumentsUpdateDocumentRequest = {
  originalFileName: string;
};

export type BankAccountsBankAccountResponse = {
  id?: string;
  currency?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
};

export type BankAccountsCreateBankAccountRequest = {
  currency: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
};

export type BankAccountsDeleteBankAccountRequest = Record<string, unknown>;

export type BankAccountsGetBankAccountRequest = Record<string, unknown>;

export type PaginationPagedListOfBankAccountResponse = {
  items?: BankAccountsBankAccountResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type BankAccountsListBankAccountsRequest = PaginationPagedRequest & Record<string, unknown>;

export type BankAccountsUpdateBankAccountRequest = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
};

export type DomainComplianceRiskListType = "pep" | "blackList";

export type RiskListsRiskListEntryResponse = {
  id?: string;
  personalIdentifier?: string;
  listType?: DomainComplianceRiskListType;
  reason?: string;
  createdOnUtc?: string;
};

export type RiskListsAddRiskListEntryRequest = {
  personalIdentifier: string;
  listType: DomainComplianceRiskListType;
  reason: string;
};

export type RiskListsDeleteRiskListEntryRequest = Record<string, unknown>;

export type PaginationPagedListOfRiskListEntryResponse = {
  items?: RiskListsRiskListEntryResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type RiskListsListRiskListEntriesRequest = PaginationPagedRequest & Record<string, unknown>;

export type CurrencyRatesCurrencyRateResponse = {
  id?: string;
  currency?: string;
  rateToAll?: number;
  publishedAtUtc?: string;
  fetchedAtUtc?: string;
};

export type PaginationPagedListOfCurrencyRateResponse = {
  items?: CurrencyRatesCurrencyRateResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type CurrencyRatesListCurrencyRatesRequest = PaginationPagedRequest & {
  latestOnly?: boolean;
  currency?: string;
};
