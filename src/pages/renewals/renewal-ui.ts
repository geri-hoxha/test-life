import { format, parseISO } from "date-fns";
import type {
  DomainPoliciesPolicyRenewalStatus,
  DomainUnderwritingDiscountRequestStatus,
  DomainUnderwritingDocumentStatus,
  DomainUnderwritingReviewFlagStatus,
  OffersDateOnlyRangeResponse,
} from "@/api/types";

export const RENEWAL_STATUSES: DomainPoliciesPolicyRenewalStatus[] = [
  "planned",
  "draft",
  "priced",
  "applied",
];

export const humanizeRenewalEnum = (value?: string | null) => {
  if (!value?.trim()) return "—";
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const renewalStatusLabel = (status?: DomainPoliciesPolicyRenewalStatus | string) => {
  if (status === "planned") return "Planned";
  if (status === "draft") return "Draft";
  if (status === "priced") return "Priced";
  if (status === "applied") return "Applied";
  return status ? humanizeRenewalEnum(status) : "—";
};

export const renewalStatusClass = (status?: DomainPoliciesPolicyRenewalStatus | string) => {
  if (status === "planned") return "bg-slate-500/15 text-slate-800 dark:text-slate-300";
  if (status === "draft") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "priced") return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
  if (status === "applied") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  return "bg-muted text-muted-foreground";
};

export const documentStatusLabel = (status?: DomainUnderwritingDocumentStatus | string) => {
  if (status === "required") return "Required";
  if (status === "submitted") return "Submitted";
  if (status === "accepted") return "Accepted";
  if (status === "refused") return "Refused";
  if (status === "waived") return "Waived";
  return status ? humanizeRenewalEnum(status) : "—";
};

export const documentStatusClass = (status?: DomainUnderwritingDocumentStatus | string) => {
  if (status === "required") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "submitted") return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
  if (status === "accepted") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  if (status === "refused") return "bg-destructive/15 text-destructive";
  if (status === "waived") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

export const flagStatusLabel = (status?: DomainUnderwritingReviewFlagStatus | string) => {
  if (status === "raised") return "Raised";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status ? humanizeRenewalEnum(status) : "—";
};

export const flagStatusClass = (status?: DomainUnderwritingReviewFlagStatus | string) => {
  if (status === "raised") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "approved") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const discountStatusLabel = (status?: DomainUnderwritingDiscountRequestStatus | string) => {
  if (status === "requested") return "Requested";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status ? humanizeRenewalEnum(status) : "—";
};

export const discountStatusClass = (status?: DomainUnderwritingDiscountRequestStatus | string) => {
  if (status === "requested") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "approved") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const formatRenewalMoney = (value?: number | null, currency?: string) => {
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

export const formatRenewalDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso.slice(0, 10);
  }
};

export const formatRenewalDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

export const formatRenewalPeriod = (period?: OffersDateOnlyRangeResponse | null) => {
  if (!period?.startDate && !period?.endDate) return "—";
  return `${formatRenewalDate(period.startDate)} → ${formatRenewalDate(period.endDate)}`;
};

export const formatDiscountPct = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
};

export const shortRenewalId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

export const renewalDetailPath = (policyId: string, renewalId: string) =>
  `/renewals/${encodeURIComponent(policyId)}/${encodeURIComponent(renewalId)}`;
