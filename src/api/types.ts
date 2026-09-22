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

export type RatingTablesListRatingTablesRequest = PaginationPagedRequest & {
  name?: string;
};

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

export type ProductsCurrencyLimitType =
  | "fixedSumInsuredAmount"
  | "minimumPremium"
  | "yearlyLimit"
  | "aggregateLimit";

export type ProductsDocumentRequirementStage = "none" | "initialOffer" | "policyRenewal";

export type ProductsDocumentReusePolicy = "requireNewSubmission" | "reuseAcceptedWithinPolicy";

export type ProductsAddProductCoverageRequest = {
  coverageId: string;
  ratingTableId: string;
  ratingTableMultiplier: number;
  isMandatory: boolean;
  isSumInsuredFixed: boolean;
  sumInsuredPercentage?: number;
};

export type ProductsUpdateProductCoverageRequest = ProductsAddProductCoverageRequest;

export type ProductsAddProductCoverageCurrencyLimitRequest = {
  currency: string;
  type: ProductsCurrencyLimitType;
  value: number;
};

export type ProductsProductDocumentTypeRequiredForResponse = {
  insuredAmountOver?: number | null;
  insuredAmountCurrency?: string | null;
  totalExposureOver?: number | null;
  totalExposureCurrency?: string | null;
  ageOver?: number | null;
  isPep?: boolean | null;
  isForeignCitizen?: boolean | null;
  alwaysRequired?: boolean;
};

export type ProductsProductDocumentTypeResponse = {
  id?: number;
  documentTypeId?: string;
  requiredFor?: ProductsProductDocumentTypeRequiredForResponse;
  stages?: ProductsDocumentRequirementStage;
  reusePolicy?: ProductsDocumentReusePolicy;
};

export type ProductsAddProductDocumentTypeRequest = {
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
};

export type ProductsAddProductBankAccountRequest = {
  bankAccountId: string;
};

export type ProductsProductBankAccountResponse = {
  id?: number;
  bankAccountId?: string;
  currency?: string;
};

export type ProductsOfferScheduleMode =
  | "initialPeriodOnly"
  | "fullScheduleAtQuote"
  | "singleCoveragePeriod";

export type ProductsPolicyContinuationMode =
  | "appendCoveragePeriodAtRenewal"
  | "issueAllPeriodsAtInception"
  | "issueNewPolicyAtRenewal";

export type ProductsCoveragePeriodCadence = "annual" | "monthly" | "wholeTerm";

export type ProductsBillingCadence =
  | "singleAtInception"
  | "oncePerCoveragePeriod"
  | "monthlyWithinCoveragePeriod";

export type ProductsPremiumCalculationMethod =
  | "declining"
  | "leveled"
  | "singlePremium"
  | "nonDecliningProrated"
  | "entryAgeFixedMonthly";

export type ProductsMaturityRuleKind = "explicitDate" | "fixedOneYear" | "attainedAge";

export type ProductsMaturityRule = {
  kind?: ProductsMaturityRuleKind;
  attainedAge?: number | null;
};

/** Read-only rules derived from `policyPlanType`. */
export type ProductsPolicyPlanRules = {
  offerSchedule?: ProductsOfferScheduleMode;
  continuation?: ProductsPolicyContinuationMode;
  coverageCadence?: ProductsCoveragePeriodCadence;
  billingCadence?: ProductsBillingCadence;
  premiumCalculation?: ProductsPremiumCalculationMethod;
  maturityRule?: ProductsMaturityRule;
};

export type ProductsActuarialCode =
  | "RT"
  | "ST"
  | "STs"
  | "STst"
  | "STmc"
  | "STmc-t"
  | "STse"
  | "STe"
  | "STmc-EX"
  | "STmc-ST"
  | "STmc-SU"
  | "STmu"
  | "STet"
  | "RP";

export type ProductsProductResponse = {
  id?: string;
  name?: string;
  coverageText?: string;
  productGroupId?: string;
  supportedCurrencies?: string[];
  defaultPrintableTemplateDocumentId?: string | null;
  defaultTermsTemplateDocumentId?: string | null;
  policyPlanType?: ProductsPolicyPlanType | null;
  planRules?: ProductsPolicyPlanRules;
  maximumCoverageTermMonths?: number | null;
  actuarialCode?: ProductsActuarialCode | null;
  sapProductCode?: string | null;
  sapChannelCode?: string | null;
  coverages?: ProductsProductCoverageResponse[];
  productDocumentTypes?: ProductsProductDocumentTypeResponse[];
  bankAccounts?: ProductsProductBankAccountResponse[];
  f5ProductCode?: string | null;
  requiresLoanBalances?: boolean;
};

/** Product classification. Replaces the former `premiumPlan` + `sumInsuredBasis` pair. */
export type ProductsPolicyPlanType =
  | "PPR-SIB"
  | "PPR-STB"
  | "PGP"
  | "PPFM"
  | "PPFV"
  | "PPRS"
  | "VOLUNTARY"
  | "PROTECT-55";

export type ProductsCreateProductRequest = {
  name: string;
  productGroupId?: string;
  policyPlanType: ProductsPolicyPlanType;
  supportedCurrencies: string[];
  coverageText?: string;
  defaultPrintableTemplateDocumentId?: string | null;
  defaultTermsTemplateDocumentId?: string | null;
  maximumCoverageTermMonths?: number | null;
  actuarialCode?: ProductsActuarialCode | null;
  sapProductCode?: string | null;
  sapChannelCode?: string | null;
  f5ProductCode?: string | null;
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

export type ProductsRemoveProductBankAccountRequest = Record<string, unknown>;

export type ProductsUpdateProductRequest = {
  name: string;
  policyPlanType: ProductsPolicyPlanType;
  supportedCurrencies: string[];
  coverageText?: string;
  defaultPrintableTemplateDocumentId?: string | null;
  defaultTermsTemplateDocumentId?: string | null;
  maximumCoverageTermMonths?: number | null;
  actuarialCode?: ProductsActuarialCode | null;
  sapProductCode?: string | null;
  sapChannelCode?: string | null;
  f5ProductCode?: string | null;
};

export type ProductGroupsProductGroupResponse = {
  id?: string;
  name?: string;
  legacyCode?: string | null;
};

export type ProductGroupsCreateProductGroupRequest = {
  name: string;
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

export type CoveragesListCoveragesRequest = PaginationPagedRequest & {
  name?: string;
};

export type CoveragesUpdateCoverageRequest = {
  name: string;
  description?: string;
};

export type DomainOffersParticipantRole = "policyHolder" | "invoiced" | "beneficiary";

export type DomainPartiesEnumsPartyType = "person" | "company";

export type DomainPoliciesPolicyStatus =
  | "pendingActivation"
  | "active"
  | "lapsed"
  | "cancelled"
  | "matured";

export type DomainPoliciesPolicyCancellationStatus = "draft" | "applied";

export type DomainPoliciesCancellationKind = "full" | "partial";

export type DomainPoliciesCancellationReason =
  | "APL1"
  | "APL2"
  | "APL3"
  | "APL4"
  | "APJ1"
  | "APJ2"
  | "APJ3"
  | "APJ4";

export type DomainPoliciesPolicyPeriodStatus = "scheduled" | "active" | "expired" | "cancelled";

export type DomainPoliciesPolicyPlan =
  | "PPR-SIB"
  | "PPR-STB"
  | "PGP"
  | "PPFM"
  | "PPFV"
  | "PPRS"
  | "VOLUNTARY"
  | "PROTECT-55";

export type DomainPoliciesRelationshipToInsured =
  | "E NJEJTE"
  | "ADMINISTRATOR"
  | "ORTAK"
  | "TJETER";

export type DomainDistributionSalesChannel =
  | "partnerApi"
  | "internalDirect"
  | "internalForPartner";

export type DomainBillingPremiumInstallmentStatus =
  | "planned"
  | "readyToInvoice"
  | "invoiced"
  | "cancelled";

export type OffersSalesAttributionResponse = {
  createdByAuthUserId?: number;
  createdByUserName?: string | null;
  salesChannel?: DomainDistributionSalesChannel;
  agentId?: string | null;
  agentDisplayName?: string | null;
  agentSelectionMethod?: string | null;
  internalBranchId?: string | null;
  internalBranchName?: string | null;
  internalOfficeId?: string | null;
  internalOfficeName?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  partnerBranchId?: string | null;
  partnerBranchName?: string | null;
  partnerOfficeId?: string | null;
  partnerOfficeName?: string | null;
};

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
  relationshipToInsured?: DomainPoliciesRelationshipToInsured | null;
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
  fatherName?: string | null;
  birthPlace?: string | null;
  addressDistrict?: string | null;
  profession?: string | null;
  position?: string | null;
};

export type PoliciesPolicyDocumentResponse = {
  id?: number;
  documentId?: string;
  documentTypeId?: string;
  sourceRenewalId?: string | null;
  coveragePeriodSequence?: number | null;
};

export type PoliciesPolicyPeriodCoverageResponse = {
  id?: number;
  coverageId?: string;
  coverageName?: string;
  coverageDescription?: string;
  sumInsured?: number;
  rateUsed?: RatingTablesRateResponse;
  ratingTableMultiplierUsed?: number;
  calculatedPremium?: number;
};

/** @deprecated Use PoliciesPolicyPeriodCoverageResponse. */
export type PoliciesPolicyCoverageResponse = PoliciesPolicyPeriodCoverageResponse;

export type PoliciesPolicyPeriodResponse = {
  id?: number;
  sequenceNumber?: number;
  period?: OffersDateOnlyRangeResponse;
  openingBalance?: number | null;
  closingBalance?: number | null;
  calculatedPremium?: number;
  chargePremium?: number;
  status?: DomainPoliciesPolicyPeriodStatus;
  sourceOfferPeriodSequence?: number | null;
  sourceRenewalId?: string | null;
  coverages?: PoliciesPolicyPeriodCoverageResponse[];
};

/** @deprecated Use PoliciesPolicyPeriodResponse. */
export type PoliciesPolicyYearResponse = PoliciesPolicyPeriodResponse;

export type PoliciesPolicyResponse = {
  id?: string;
  serial?: number;
  productId?: string;
  currency?: string;
  offerId?: string;
  issuedOnUtc?: string;
  coverageTerm?: OffersDateOnlyRangeResponse;
  coverageText?: string;
  printableTemplateDocumentId?: string;
  termsTemplateDocumentId?: string | null;
  policyPlan?: DomainPoliciesPolicyPlan;
  requiresLoanBalances?: boolean;
  status?: DomainPoliciesPolicyStatus;
  activatedOnUtc?: string | null;
  cancelledOnUtc?: string | null;
  cancellationEffectiveOn?: string | null;
  isIssued?: boolean;
  renewedFromPolicyId?: string | null;
  salesAttribution?: OffersSalesAttributionResponse | null;
  yearlyLimit?: number | null;
  aggregateLimit?: number | null;
  exchangeRateToAll?: number | null;
  participants?: PoliciesPolicyParticipantResponse[];
  insuredPersons?: PoliciesPolicyInsuredPersonResponse[];
  documents?: PoliciesPolicyDocumentResponse[];
  periods?: PoliciesPolicyPeriodResponse[];
};

export type PoliciesPolicyCancellationResponse = {
  id?: string;
  policyId?: string;
  status?: DomainPoliciesPolicyCancellationStatus;
  kind?: DomainPoliciesCancellationKind;
  registeredOn?: string;
  effectiveOn?: string;
  reason?: DomainPoliciesCancellationReason | string;
  note?: string | null;
  administrativeExpensePercentage?: number;
  exchangeRateToAll?: number | null;
  currency?: string;
  premiumInvoiced?: number;
  coverageDays?: number;
  consumedDays?: number;
  consumedPremium?: number;
  unearnedPremium?: number;
  administrativeExpenses?: number;
  refundAmount?: number;
  refundAmountAll?: number | null;
  agentCommissionReversed?: number;
  partnerCommissionReversed?: number;
  registeredByAuthUserId?: number;
  registeredOnUtc?: string;
  appliedByAuthUserId?: number | null;
  appliedOnUtc?: string | null;
};

export type PoliciesPolicyCancellationRequest = {
  kind?: DomainPoliciesCancellationKind;
  reason: DomainPoliciesCancellationReason | string;
  registeredOn?: string | null;
  effectiveOn?: string | null;
  note?: string | null;
  administrativeExpensePercentage?: number | null;
  exchangeRateToAll?: number | null;
};

export type PoliciesApplyPolicyCancellationResponse = {
  cancellation?: PoliciesPolicyCancellationResponse;
  creditInvoices?: InvoicesInvoiceResponse[];
};

export type PoliciesPolicyListItemResponse = {
  id?: string;
  serial?: number;
  productId?: string;
  productName?: string | null;
  policyPlan?: DomainPoliciesPolicyPlan;
  status?: DomainPoliciesPolicyStatus;
  issuedOnUtc?: string;
  offerId?: string;
  renewedFromPolicyId?: string | null;
  coverageTerm?: OffersDateOnlyRangeResponse;
  currency?: string;
  sumInsured?: number | null;
  primaryCoverageName?: string | null;
  firstPeriodChargePremium?: number | null;
  policyHolderName?: string | null;
  insuredName?: string | null;
  insuredAge?: number | null;
  salesChannel?: DomainDistributionSalesChannel | null;
  salesPartyName?: string | null;
  periodCount?: number;
  documentCount?: number;
};

export type PoliciesPremiumInstallmentResponse = {
  id?: string;
  policyId?: string;
  coveragePeriodSequence?: number | null;
  installmentSequence?: number;
  servicePeriod?: OffersDateOnlyRangeResponse;
  invoiceOnDate?: string;
  dueDate?: string;
  currency?: string;
  amount?: number;
  status?: DomainBillingPremiumInstallmentStatus;
  createdOnUtc?: string;
};

export type PoliciesGetPolicyRequest = Record<string, unknown>;

export type PoliciesIssuePolicyRequest = Record<string, never>;

export type PoliciesIssuePolicyResponse = {
  policy?: PoliciesPolicyResponse;
  installments?: PoliciesPremiumInstallmentResponse[];
  invoices?: InvoicesInvoiceResponse[];
};

export type PaginationPagedListOfPolicyListItemResponse = {
  items?: PoliciesPolicyListItemResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

/** @deprecated Use PaginationPagedListOfPolicyListItemResponse. */
export type PaginationPagedListOfPolicyResponse = PaginationPagedListOfPolicyListItemResponse;

export type PoliciesListPoliciesRequest = PaginationPagedRequest & {
  productId?: string;
  offerId?: string;
  currency?: string;
  issuedFromUtc?: string;
  issuedToUtc?: string;
  coverageOn?: string;
  partyId?: string;
  personId?: string;
  serial?: number;
  pageNumber?: number;
  pageSize?: number;
};

export type SmartEnumsEnumItem = {
  value: string;
  text: string;
};

export type PeoplePersonResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  personalIdentifier?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
  fatherName?: string | null;
  birthPlace?: string | null;
  addressDistrict?: string | null;
  profession?: string | null;
  position?: string | null;
};

export type PeopleCreatePersonRequest = {
  firstName: string;
  lastName: string;
  personalIdentifier: string;
  nationality: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
  fatherName?: string | null;
  birthPlace?: string | null;
  addressDistrict?: string | null;
  profession?: string | null;
  position?: string | null;
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

export type PeopleListPeopleRequest = PaginationPagedRequest & {
  personalIdentifier?: string;
  nationality?: string;
  firstName?: string;
  lastName?: string;
  gender?: DomainCommonGender;
};

export type PeopleUpdatePersonRequest = {
  firstName: string;
  lastName: string;
  personalIdentifier: string;
  nationality: string;
  dateOfBirth?: string;
  gender?: DomainCommonGender;
  fatherName?: string | null;
  birthPlace?: string | null;
  addressDistrict?: string | null;
  profession?: string | null;
  position?: string | null;
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
  companyType?: DomainPartiesEnumsCompanyType;
  addresses?: CompaniesCompanyAddressResponse[];
};

export type CompaniesCreateCompanyRequest = {
  legalName: string;
  registrationNumber: string;
  countryCode: string;
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

export type CompaniesListCompaniesRequest = PaginationPagedRequest & {
  registrationNumber?: string;
  countryCode?: string;
  legalName?: string;
  tradeName?: string;
  companyType?: DomainPartiesEnumsCompanyType;
};

export type CompaniesRemoveCompanyAddressRequest = Record<string, unknown>;

export type CompaniesUpdateCompanyRequest = {
  legalName: string;
  tradeName?: string | null;
  registrationNumber: string;
  countryCode: string;
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
  relationshipToInsured?: DomainPoliciesRelationshipToInsured | null;
};

export type OffersAddOfferParticipantRequest = {
  partyId?: string;
  partyType?: DomainPartiesEnumsPartyType;
  role?: DomainOffersParticipantRole;
  isLeader?: boolean;
  share?: number | null;
  relationshipToInsured?: DomainPoliciesRelationshipToInsured | null;
};

export type DomainOffersOfferPeriodStatus = "draft" | "quoted" | "appliedToPolicy" | "cancelled";

export type OffersOfferPeriodCoverageResponse = {
  id?: number;
  coverageId?: string;
  sumInsured?: number;
  rateUsed?: RatingTablesRateResponse;
  ratingTableMultiplierUsed?: number;
  calculatedPremium?: number;
};

export type OffersOfferPeriodResponse = {
  id?: number;
  sequenceNumber?: number;
  period?: OffersDateOnlyRangeResponse;
  openingBalance?: number | null;
  closingBalance?: number | null;
  calculatedPremium?: number;
  chargePremium?: number;
  status?: DomainOffersOfferPeriodStatus;
  coverages?: OffersOfferPeriodCoverageResponse[];
};

export type OffersOfferLoanSubmissionResponse = {
  id?: number;
  sourceSystem?: string;
  externalReference?: string | null;
  rawPayload?: string;
  receivedOnUtc?: string;
};

export type OffersSubmitOfferLoanPeriodRequest = {
  sequenceNumber?: number;
  periodStart?: string;
  periodEnd?: string;
  openingBalance?: number;
  closingBalance?: number;
};

export type OffersSubmitOfferLoanRequest = {
  sourceSystem: string;
  externalReference?: string | null;
  /** JSON object or array. Echo of the loan-submission request. */
  rawPayload?: Record<string, unknown> | unknown[];
  periods: OffersSubmitOfferLoanPeriodRequest[];
};

export type OffersSubmitOfferLoanResponse = {
  submission?: OffersOfferLoanSubmissionResponse;
  periods?: OffersOfferPeriodResponse[];
};

export type OffersUnderwritingDocumentRequirementResponse = {
  id?: number;
  documentTypeId?: string;
  documentId?: string | null;
  status?: DomainUnderwritingDocumentStatus;
  submissionSource?: DomainUnderwritingDocumentSubmissionSource | null;
  refusalReason?: string | null;
  waiverReason?: string | null;
  isSatisfied?: boolean;
  submittedOnUtc?: string | null;
  submittedByAuthUserId?: number | null;
  decidedOnUtc?: string | null;
  decidedByAuthUserId?: number | null;
};

export type OffersUnderwritingReviewFlagResponse = {
  id?: number;
  type?: DomainUnderwritingReviewFlagType | string;
  reason?: string;
  status?: DomainUnderwritingReviewFlagStatus | string;
  resolutionNote?: string | null;
  raisedOnUtc?: string;
  resolvedOnUtc?: string | null;
  resolvedByAuthUserId?: number | null;
};

export type OffersUnderwritingDiscountRequestResponse = {
  id?: number;
  requestedDiscountPercentage?: number;
  reason?: string;
  targetPeriodSequence?: number | null;
  status?: DomainUnderwritingDiscountRequestStatus;
  requestedByAuthUserId?: number;
  requestedOnUtc?: string;
  decidedByAuthUserId?: number | null;
  decidedOnUtc?: string | null;
};

/** Slim shape used by POST /offers/{offerId}/premium preview UI. */
export type OffersOfferPremiumPreview = {
  sequenceNumber?: number;
  year?: number;
  insuredAmount: number;
  premium: number;
  payPremium: number;
};

export type DomainOffersOfferStatus = "draft" | "quoted" | "bound" | "cancelled" | "expired";

export type OffersOfferResponse = {
  id?: string;
  productId?: string;
  currency?: string;
  coverageTerm?: OffersDateOnlyRangeResponse;
  policyPlan?: ProductsPolicyPlanType;
  requiresLoanBalances?: boolean;
  status?: DomainOffersOfferStatus;
  policyId?: string | null;
  renewedFromPolicyId?: string | null;
  createdOnUtc?: string;
  quotedOnUtc?: string | null;
  salesAttribution?: OffersSalesAttributionResponse | null;
  participants?: OffersOfferParticipantResponse[];
  insuredPersons?: OffersOfferInsuredPersonResponse[];
  periods?: OffersOfferPeriodResponse[];
  loanSubmissions?: OffersOfferLoanSubmissionResponse[];
  documentRequirements?: OffersUnderwritingDocumentRequirementResponse[];
  reviewFlags?: OffersUnderwritingReviewFlagResponse[];
  discountRequests?: OffersUnderwritingDiscountRequestResponse[];
};

export type OffersOfferListItemResponse = {
  id?: string;
  productId?: string;
  productName?: string | null;
  policyPlan?: ProductsPolicyPlanType;
  status?: DomainOffersOfferStatus;
  createdOnUtc?: string;
  expiresOnUtc?: string | null;
  policyId?: string | null;
  renewedFromPolicyId?: string | null;
  coverageTerm?: OffersDateOnlyRangeResponse;
  currency?: string;
  sumInsured?: number | null;
  firstPeriodChargePremium?: number | null;
  policyHolderName?: string | null;
  insuredName?: string | null;
  insuredAge?: number | null;
  salesChannel?: DomainDistributionSalesChannel | null;
  salesPartyName?: string | null;
  outstandingDocumentCount?: number;
  raisedReviewFlagCount?: number;
  pendingDiscountRequestCount?: number;
};

export type OffersCancelOfferRequest = Record<string, unknown>;

/** POST /api/offers — `CreateOfferRequest`. */
export type OffersCreateOfferRequest = {
  productId?: string;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  partnerOfficeId?: string | null;
  agentId?: string | null;
};

export type OffersGetOfferRequest = Record<string, unknown>;

export type PaginationPagedListOfOfferListItemResponse = {
  items?: OffersOfferListItemResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

/** @deprecated List items are `OfferListItemResponse`. */
export type PaginationPagedListOfOfferResponse = PaginationPagedListOfOfferListItemResponse;

export type OffersListOffersRequest = PaginationPagedRequest & {
  status?: DomainOffersOfferStatus;
  productId?: string;
  currency?: string;
  createdFromUtc?: string;
  createdToUtc?: string;
  partyId?: string;
  personId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type OffersResolveOfferReviewFlagRequest = {
  note: string;
};

export type OffersRefuseOfferDocumentRequest = {
  reason: string;
};

export type OffersSubmitOfferDocumentRequest = {
  documentId?: string;
};

export type OffersWaiveOfferDocumentRequest = {
  reason: string;
};

export type OffersRequestOfferDiscountRequest = {
  requestedDiscountPercentage?: number;
  reason: string;
  targetPeriodSequence?: number | null;
};

export type OffersRemoveOfferInsuredPersonRequest = Record<string, unknown>;

export type OffersRemoveOfferParticipantRequest = Record<string, unknown>;

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
  originalFileName?: string;
  createdFromUtc?: string;
  createdToUtc?: string;
  isDeleted?: boolean;
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

export type BankAccountsListBankAccountsRequest = PaginationPagedRequest & {
  currency?: string;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
};

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

export type RiskListsListRiskListEntriesRequest = PaginationPagedRequest & {
  personalIdentifier?: string;
  listType?: DomainComplianceRiskListType;
  createdFromUtc?: string;
  createdToUtc?: string;
};

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

/** POST /api/auth/token */
export type AuthTokenRequest = {
  username: string;
  password: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  expiresOnUtc: string;
};

/** GET /api/me/sales-access */
export type GrantedPartnerOfficeResponse = {
  partnerId?: Ulid;
  partnerName?: string;
  partnerOfficeId?: Ulid;
  officeCode?: string;
  officeName?: string;
  isActive?: boolean;
};

export type GrantedAgentResponse = {
  agentId?: Ulid;
  displayName?: string;
  isActive?: boolean;
};

export type UserSalesAccessResponse = {
  authUserId: number;
  mayChooseAgent: boolean;
  partnerOffices: GrantedPartnerOfficeResponse[];
  agents: GrantedAgentResponse[];
};

export type DomainInvoicesInvoiceStatus = "pending" | "failed" | "fiscalized";

export type DomainInvoicesInvoiceType = "credit" | "sale";

export type InvoicesServicePeriod = {
  startDate?: string;
  endDate?: string;
};

export type InvoicesInvoiceLineResponse = {
  id?: number;
  lineNumber?: number;
  type?: string;
  name?: string;
  fiscalName?: string;
  quantity?: number;
  fiscalUnitCode?: string;
  netAmountPerUnit?: number;
  vatAmountPerUnit?: number;
  vatCategory?: string;
  vatPercentage?: number;
  vatExemptionReasonCode?: string | null;
  lineNetAmount?: number;
  lineVatAmount?: number;
  lineGrossAmount?: number;
};

export type InvoicesInvoiceListItemResponse = {
  id?: string;
  number?: number;
  policySerial?: number;
  policyId?: string;
  premiumInstallmentId?: string;
  type?: DomainInvoicesInvoiceType;
  servicePeriod?: InvoicesServicePeriod;
  dueDate?: string;
  currency?: string;
  totalNetAmount?: number;
  totalVatAmount?: number;
  totalGrossAmount?: number;
  issuedOn?: string;
  status?: DomainInvoicesInvoiceStatus;
  iic?: string | null;
  fic?: string | null;
  customerName?: string;
  lineCount?: number;
  provider?: string;
};

export type InvoicesInvoiceResponse = InvoicesInvoiceListItemResponse & {
  qrUrl?: string | null;
  errorCode?: string | null;
  faultDescription?: string | null;
  lines?: InvoicesInvoiceLineResponse[];
  externalDocumentId?: string | null;
  creditsInvoiceId?: string | null;
  creditedByInvoiceId?: string | null;
};

export type PaginationPagedListOfInvoiceListItemResponse = {
  items?: InvoicesInvoiceListItemResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type InvoicesListInvoicesRequest = PaginationPagedRequest & {
  policyId?: string;
  status?: DomainInvoicesInvoiceStatus;
  type?: DomainInvoicesInvoiceType;
};

export type InvoicesRetryFiscalizationRequest = {
  reason: string;
  externalDocumentId?: string;
};

export type DomainCommissionsBusinessType = "newBusiness" | "renewal";

export type DomainCommissionsBasis = "premium" | "sumInsured";

export type DomainCommissionsEntryType = "accrual" | "reversal";

export type AgentCommissionsAgentCommissionResponse = {
  id?: string;
  agentId?: string;
  productId?: string;
  productName?: string | null;
  policyId?: string;
  policySerial?: number;
  premiumInstallmentId?: string;
  agentProductConfigurationId?: string;
  businessType?: DomainCommissionsBusinessType;
  basis?: DomainCommissionsBasis;
  appliedRate?: number;
  basisAmount?: number;
  amount?: number;
  currency?: string;
  entryType?: DomainCommissionsEntryType;
  calculationVersion?: number;
  postedOnUtc?: string;
};

export type PaginationPagedListOfAgentCommissionResponse = {
  items?: AgentCommissionsAgentCommissionResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type AgentCommissionsListAgentCommissionsRequest = PaginationPagedRequest & {
  agentId?: string;
  policyId?: string;
  productId?: string;
  businessType?: DomainCommissionsBusinessType;
  entryType?: DomainCommissionsEntryType;
  postedFrom?: string;
  postedTo?: string;
};

export type CommissionsCommissionSummaryLine = {
  currency?: string;
  businessType?: DomainCommissionsBusinessType;
  entryCount?: number;
  accruedAmount?: number;
  reversedAmount?: number;
  netAmount?: number;
};

export type CommissionsCommissionSummaryResponse = {
  lines?: CommissionsCommissionSummaryLine[];
};

export type AgentCommissionsGetSummaryRequest = {
  agentId?: string;
  from?: string;
  to?: string;
};

export type AgentsAgentResponse = {
  id?: string;
  displayName?: string;
  isActive?: boolean;
};

export type PaginationPagedListOfAgentResponse = {
  items?: AgentsAgentResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type AgentsListAgentsRequest = PaginationPagedRequest & {
  isActive?: boolean;
};

export type AgentsCreateAgentRequest = {
  displayName: string;
};

export type AgentsUpdateAgentRequest = {
  displayName: string;
  isActive?: boolean;
};

export type AgentsAgentProductConfigurationResponse = {
  id?: string;
  agentId?: string;
  productId?: string;
  newBusinessCommissionBasis?: DomainCommissionsBasis;
  newBusinessCommissionRate?: number;
  renewalCommissionBasis?: DomainCommissionsBasis;
  renewalCommissionRate?: number;
  effectiveFrom?: string;
  effectiveToExclusive?: string | null;
};

export type AgentsCreateAgentProductConfigurationRequest = {
  productId?: string;
  newBusinessCommissionBasis?: DomainCommissionsBasis;
  newBusinessCommissionRate?: number;
  renewalCommissionBasis?: DomainCommissionsBasis;
  renewalCommissionRate?: number;
  effectiveFrom?: string;
  effectiveToExclusive?: string | null;
};

export type AgentsUpdateAgentProductConfigurationRequest = {
  effectiveFrom?: string;
  effectiveToExclusive?: string | null;
};

export type PartnersPartnerResponse = {
  id?: string;
  name?: string;
  isActive?: boolean;
};

export type PaginationPagedListOfPartnerResponse = {
  items?: PartnersPartnerResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type PartnersListPartnersRequest = PaginationPagedRequest & {
  isActive?: boolean;
};

export type PartnersCreatePartnerRequest = {
  name: string;
};

export type PartnersUpdatePartnerRequest = {
  name: string;
  isActive?: boolean;
};

export type PartnersPartnerOfficeResponse = {
  id?: string;
  partnerId?: string;
  code?: string;
  name?: string;
  address?: string | null;
  isActive?: boolean;
};

export type PartnersCreatePartnerOfficeRequest = {
  code: string;
  name: string;
  address?: string | null;
};

export type PartnersUpdatePartnerOfficeRequest = {
  code: string;
  name: string;
  address?: string | null;
  isActive?: boolean;
};

export type PartnersListPartnerOfficesRequest = {
  isActive?: boolean;
};

export type PartnersPartnerProductConfigurationResponse = {
  id?: string;
  partnerId?: string;
  productId?: string;
  newBusinessCommissionBasis?: DomainCommissionsBasis;
  newBusinessCommissionRate?: number;
  renewalCommissionBasis?: DomainCommissionsBasis;
  renewalCommissionRate?: number;
  effectiveFrom?: string;
  effectiveToExclusive?: string | null;
};

export type PartnersCreatePartnerProductConfigurationRequest = {
  productId?: string;
  newBusinessCommissionBasis?: DomainCommissionsBasis;
  newBusinessCommissionRate?: number;
  renewalCommissionBasis?: DomainCommissionsBasis;
  renewalCommissionRate?: number;
  effectiveFrom?: string;
  effectiveToExclusive?: string | null;
};

export type PartnersUpdatePartnerProductConfigurationRequest = {
  effectiveFrom?: string;
  effectiveToExclusive?: string | null;
};

export type PartnersListPartnerProductConfigurationsRequest = {
  productId?: string;
  effectiveOn?: string;
};

export type PartnerCommissionsPartnerCommissionResponse = {
  id?: string;
  partnerId?: string;
  productId?: string;
  productName?: string | null;
  policyId?: string;
  policySerial?: number;
  premiumInstallmentId?: string;
  partnerProductConfigurationId?: string;
  businessType?: DomainCommissionsBusinessType;
  basis?: DomainCommissionsBasis;
  appliedRate?: number;
  basisAmount?: number;
  amount?: number;
  currency?: string;
  entryType?: DomainCommissionsEntryType;
  calculationVersion?: number;
  postedOnUtc?: string;
};

export type PaginationPagedListOfPartnerCommissionResponse = {
  items?: PartnerCommissionsPartnerCommissionResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type PartnerCommissionsListPartnerCommissionsRequest = PaginationPagedRequest & {
  partnerId?: string;
  policyId?: string;
  productId?: string;
  businessType?: DomainCommissionsBusinessType;
  entryType?: DomainCommissionsEntryType;
  postedFrom?: string;
  postedTo?: string;
};

export type PartnerCommissionsGetSummaryRequest = {
  partnerId?: string;
  from?: string;
  to?: string;
};

export type DomainPoliciesPolicyRenewalStatus = "planned" | "draft" | "priced" | "applied";

export type DomainUnderwritingDocumentStatus =
  | "required"
  | "submitted"
  | "accepted"
  | "refused"
  | "waived";

export type DomainUnderwritingDocumentSubmissionSource =
  | "newSubmission"
  | "existingPolicyDocument";

export type DomainUnderwritingReviewFlagType =
  | "blackList"
  | "pep"
  | "foreignCitizen"
  | "clientSsnInconsistent"
  | "clientAge"
  | "approvalLimit"
  | "exposure";

export type DomainUnderwritingReviewFlagStatus = "raised" | "approved" | "rejected";

export type DomainUnderwritingDiscountRequestStatus = "requested" | "approved" | "rejected";

export type PoliciesUnderwritingDocumentRequirementResponse =
  OffersUnderwritingDocumentRequirementResponse;

export type PoliciesUnderwritingReviewFlagResponse = OffersUnderwritingReviewFlagResponse;

export type PoliciesUnderwritingDiscountRequestResponse =
  OffersUnderwritingDiscountRequestResponse;

export type PoliciesPolicyRenewalCoverageResponse = {
  id?: number;
  coverageId?: string;
  coverageName?: string;
  coverageDescription?: string;
  sumInsured?: number;
  rateUsed?: RatingTablesRateResponse;
  ratingTableMultiplierUsed?: number;
  calculatedPremium?: number;
};

export type PoliciesPolicyRenewalResponse = {
  id?: string;
  policyId?: string;
  requiresLoanBalances?: boolean;
  targetPeriodSequence?: number;
  targetPeriod?: OffersDateOnlyRangeResponse;
  sourceOfferPeriodSequence?: number | null;
  existingExposure?: number;
  openingBalance?: number | null;
  closingBalance?: number | null;
  calculatedPremium?: number;
  chargePremium?: number;
  status?: DomainPoliciesPolicyRenewalStatus;
  createdOnUtc?: string;
  startedOnUtc?: string | null;
  pricedOnUtc?: string | null;
  appliedOnUtc?: string | null;
  coverages?: PoliciesPolicyRenewalCoverageResponse[];
  documentRequirements?: PoliciesUnderwritingDocumentRequirementResponse[];
  reviewFlags?: PoliciesUnderwritingReviewFlagResponse[];
  discountRequests?: PoliciesUnderwritingDiscountRequestResponse[];
};

export type PoliciesRenewalListItemResponse = {
  id?: string;
  policyId?: string;
  policySerial?: number;
  productId?: string;
  productName?: string | null;
  policyPlan?: ProductsPolicyPlanType | string;
  targetPeriodSequence?: number;
  targetPeriod?: OffersDateOnlyRangeResponse;
  status?: DomainPoliciesPolicyRenewalStatus;
  requiresLoanBalances?: boolean;
  openingBalance?: number | null;
  closingBalance?: number | null;
  chargePremium?: number;
  insuredName?: string | null;
  outstandingDocumentCount?: number;
  raisedReviewFlagCount?: number;
  pendingDiscountRequestCount?: number;
};

export type PaginationPagedListOfRenewalListItemResponse = {
  items?: PoliciesRenewalListItemResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type PoliciesListRenewalsRequest = PaginationPagedRequest & {
  policyId?: string;
  status?: DomainPoliciesPolicyRenewalStatus;
  due?: boolean;
};

export type PoliciesStartPolicyRenewalRequest = {
  openingBalance?: number | null;
  closingBalance?: number | null;
};

export type PoliciesResolveRenewalFlagRequest = {
  note: string;
};

export type PoliciesResolveRenewalDocumentRequest = {
  reason: string;
};

export type PoliciesSubmitRenewalDocumentRequest = {
  documentId?: string;
};

export type PoliciesRequestRenewalDiscountRequest = {
  requestedDiscountPercentage?: number;
  reason: string;
};

export type PoliciesApplyPolicyRenewalResponse = {
  policy?: PoliciesPolicyResponse;
  installments?: PoliciesPremiumInstallmentResponse[];
  invoices?: InvoicesInvoiceResponse[];
};

/** GET /api/users */
export type UsersUserResponse = {
  id?: number;
  publicId?: string;
  userName?: string;
  email?: string | null;
  displayName?: string;
  isActive?: boolean;
  roles?: string[];
};

export type PaginationPagedListOfUserResponse = {
  items?: UsersUserResponse[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pageCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type UsersListUsersRequest = PaginationPagedRequest & {
  isActive?: boolean;
  role?: string;
};

/** POST /api/users */
export type UsersCreateUserRequest = {
  username: string;
  email: string;
  password: string;
  displayName: string;
  roles: string[];
};

/** PUT /api/users/{authUserId} */
export type UsersUpdateUserRequest = {
  displayName: string;
  isActive?: boolean;
  roles: string[];
};
