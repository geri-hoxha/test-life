import { format, parseISO } from "date-fns";
import type {
  DomainDistributionSalesChannel,
  DomainOffersOfferPeriodStatus,
  DomainOffersOfferStatus,
  DomainUnderwritingDiscountRequestStatus,
  DomainUnderwritingDocumentStatus,
  DomainUnderwritingDocumentSubmissionSource,
  OffersDateOnlyRangeResponse,
  OffersOfferListItemResponse,
  OffersSalesAttributionResponse,
  RatingTablesRateResponse,
} from "@/api/types";

export const OFFER_STATUSES: DomainOffersOfferStatus[] = [
  "draft",
  "quoted",
  "bound",
  "cancelled",
  "expired",
];

export const humanizeOfferEnum = (value?: string | null) => {
  if (!value?.trim()) return "—";
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const offerStatusLabel = (status?: DomainOffersOfferStatus | string | null) => {
  const key = status?.trim().toLowerCase();
  if (key === "draft") return "Draft";
  if (key === "quoted") return "Quoted";
  if (key === "bound") return "Bound";
  if (key === "cancelled") return "Cancelled";
  if (key === "expired") return "Expired";
  return status ? humanizeOfferEnum(status) : "—";
};

export const offerStatusClass = (status?: DomainOffersOfferStatus | string | null) => {
  const key = status?.trim().toLowerCase();
  if (key === "draft") return "bg-muted text-muted-foreground";
  if (key === "quoted") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (key === "bound") return "bg-primary/15 text-primary";
  if (key === "cancelled") return "bg-destructive/15 text-destructive";
  if (key === "expired") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

export const periodStatusLabel = (status?: DomainOffersOfferPeriodStatus | string | null) => {
  if (status === "draft") return "Draft";
  if (status === "quoted") return "Quoted";
  if (status === "appliedToPolicy") return "Applied to policy";
  if (status === "cancelled") return "Cancelled";
  return status ? humanizeOfferEnum(status) : "—";
};

export const periodStatusClass = (status?: DomainOffersOfferPeriodStatus | string | null) => {
  if (status === "draft") return "bg-muted text-muted-foreground";
  if (status === "quoted") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === "appliedToPolicy") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const documentStatusLabel = (status?: DomainUnderwritingDocumentStatus | string | null) => {
  if (status === "required") return "Required";
  if (status === "submitted") return "Submitted";
  if (status === "accepted") return "Accepted";
  if (status === "refused") return "Refused";
  if (status === "waived") return "Waived";
  return status ? humanizeOfferEnum(status) : "—";
};

export const submissionSourceLabel = (
  source?: DomainUnderwritingDocumentSubmissionSource | string | null,
) => {
  if (source === "newSubmission") return "New submission";
  if (source === "existingPolicyDocument") return "Existing policy document";
  return source ? humanizeOfferEnum(source) : null;
};

export const discountStatusLabel = (
  status?: DomainUnderwritingDiscountRequestStatus | string | null,
) => {
  if (status === "requested") return "Requested";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status ? humanizeOfferEnum(status) : "—";
};

export const discountStatusClass = (
  status?: DomainUnderwritingDiscountRequestStatus | string | null,
) => {
  if (status === "requested") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (status === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const agentSelectionMethodLabel = (method?: string | null) =>
  method ? humanizeOfferEnum(method) : "—";

export const salesChannelLabel = (channel?: DomainDistributionSalesChannel | string | null) => {
  if (channel === "partnerApi") return "Partner API";
  if (channel === "internalDirect") return "Internal direct";
  if (channel === "internalForPartner") return "Internal for partner";
  return channel ? humanizeOfferEnum(channel) : "—";
};

export const participantRoleLabel = (role?: string | null) => {
  if (role === "policyHolder") return "Policy holder";
  if (role === "invoiced") return "Payer";
  if (role === "beneficiary") return "Beneficiary";
  return role ? humanizeOfferEnum(role) : "—";
};

export const participantRoleClass = (role?: string | null) => {
  if (role === "policyHolder") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (role === "invoiced") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (role === "beneficiary") return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
  return "bg-muted text-muted-foreground";
};

export const formatSharePct = (share?: number | null) => {
  if (share == null || Number.isNaN(share)) return null;
  return `${Math.round(share * 10000) / 100}%`;
};

export const formatOfferMoney = (value?: number | null, currency?: string) => {
  if (value == null || Number.isNaN(value)) return "—";
  const ccy = currency?.trim() || "ALL";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${ccy}`;
  }
};

export const formatOfferDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso.slice(0, 10);
  }
};

export const formatOfferDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

export const formatCoverageTerm = (term?: OffersDateOnlyRangeResponse | null) => {
  if (!term?.startDate && !term?.endDate) return "—";
  return `${formatOfferDate(term.startDate)} → ${formatOfferDate(term.endDate)}`;
};

export const formatRate = (rate: RatingTablesRateResponse | undefined, currency: string) => {
  if (!rate) return "—";
  if (rate.isFlat) {
    return formatOfferMoney(rate.flatValue ?? 0, rate.flatValueCurrency || currency);
  }
  if (rate.percentageValue != null) {
    return `${rate.percentageValue * 100}%`;
  }
  return "—";
};

export const formatDiscountPct = (fraction?: number | null) => {
  if (fraction == null || Number.isNaN(fraction)) return "—";
  return `${Math.round(fraction * 10000) / 100}%`;
};

export const shortOfferId = (id?: string | null) => {
  if (!id) return "—";
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
};

export const salesPartyLabel = (attribution?: OffersSalesAttributionResponse | null) => {
  if (!attribution) return null;
  return (
    attribution.partnerName?.trim() ||
    attribution.agentDisplayName?.trim() ||
    attribution.partnerOfficeName?.trim() ||
    attribution.internalOfficeName?.trim() ||
    attribution.internalBranchName?.trim() ||
    attribution.createdByUserName?.trim() ||
    null
  );
};

export const offerListLabel = (o: OffersOfferListItemResponse) => {
  const parts = [
    shortOfferId(o.id),
    o.policyHolderName,
    offerStatusLabel(o.status),
    o.currency,
  ].filter(Boolean);
  return parts.join(" · ");
};

export const REASON_MAX_LENGTH = 512;
export const LOAN_SOURCE_SYSTEM_MAX_LENGTH = 100;
export const LOAN_EXTERNAL_REFERENCE_MAX_LENGTH = 200;
