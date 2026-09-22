import { format, parseISO } from "date-fns";
import type {
  DomainBillingPremiumInstallmentStatus,
  DomainDistributionSalesChannel,
  DomainPoliciesCancellationKind,
  DomainPoliciesPolicyCancellationStatus,
  DomainPoliciesPolicyPeriodStatus,
  DomainPoliciesPolicyStatus,
  OffersDateOnlyRangeResponse,
  OffersSalesAttributionResponse,
} from "@/api/types";

export const POLICY_STATUSES: DomainPoliciesPolicyStatus[] = [
  "pendingActivation",
  "active",
  "lapsed",
  "cancelled",
  "matured",
];

export const policyStatusLabel = (status?: DomainPoliciesPolicyStatus | string | null) => {
  if (status === "pendingActivation") return "Pending activation";
  if (status === "active") return "Active";
  if (status === "lapsed") return "Lapsed";
  if (status === "cancelled") return "Cancelled";
  if (status === "matured") return "Matured";
  return status ? humanizePolicyEnum(status) : "—";
};

export const policyStatusClass = (status?: DomainPoliciesPolicyStatus | string | null) => {
  if (status === "pendingActivation") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === "active") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "lapsed") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  if (status === "matured") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
};

export const periodStatusLabel = (status?: DomainPoliciesPolicyPeriodStatus | string | null) => {
  if (status === "scheduled") return "Scheduled";
  if (status === "active") return "Active";
  if (status === "expired") return "Expired";
  if (status === "cancelled") return "Cancelled";
  return status ? humanizePolicyEnum(status) : "—";
};

export const periodStatusClass = (status?: DomainPoliciesPolicyPeriodStatus | string | null) => {
  if (status === "scheduled") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === "active") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "expired") return "bg-muted text-muted-foreground";
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const cancellationStatusLabel = (
  status?: DomainPoliciesPolicyCancellationStatus | string | null,
) => {
  if (status === "draft") return "Draft";
  if (status === "applied") return "Applied";
  return status ? humanizePolicyEnum(status) : "—";
};

export const cancellationStatusClass = (
  status?: DomainPoliciesPolicyCancellationStatus | string | null,
) => {
  if (status === "draft") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "applied") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const cancellationKindLabel = (kind?: DomainPoliciesCancellationKind | string | null) => {
  if (kind === "full") return "Full";
  if (kind === "partial") return "Partial";
  return kind ? humanizePolicyEnum(kind) : "—";
};

export const installmentStatusLabel = (
  status?: DomainBillingPremiumInstallmentStatus | string | null,
) => {
  if (status === "planned") return "Planned";
  if (status === "readyToInvoice") return "Ready to invoice";
  if (status === "invoiced") return "Invoiced";
  if (status === "cancelled") return "Cancelled";
  return status ? humanizePolicyEnum(status) : "—";
};

export const installmentStatusClass = (
  status?: DomainBillingPremiumInstallmentStatus | string | null,
) => {
  if (status === "planned") return "bg-muted text-muted-foreground";
  if (status === "readyToInvoice") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === "invoiced") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

export const salesChannelLabel = (channel?: DomainDistributionSalesChannel | string | null) => {
  if (channel === "partnerApi") return "Partner API";
  if (channel === "internalDirect") return "Internal direct";
  if (channel === "internalForPartner") return "Internal for partner";
  return channel ? humanizePolicyEnum(channel) : "—";
};

export const formatPolicyMoney = (value?: number | null, currency?: string) => {
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

export const formatPolicyDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso.slice(0, 10);
  }
};

export const formatPolicyDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

export const formatCoverageTerm = (term?: OffersDateOnlyRangeResponse | null) => {
  if (!term?.startDate && !term?.endDate) return "—";
  return `${formatPolicyDate(term.startDate)} → ${formatPolicyDate(term.endDate)}`;
};

export const humanizePolicyEnum = (value?: string | null) => {
  if (!value?.trim()) return "—";
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const shortPolicyId = (id?: string | null) => {
  if (!id) return "—";
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
};

export const policyNumberLabel = (serial?: number | null, id?: string | null) => {
  if (serial != null) return String(serial);
  return shortPolicyId(id);
};

export const shareToPercentage = (share?: number | null) =>
  Math.round((share ?? 0) * 10000) / 100;

export const salesPartyLabel = (attribution?: OffersSalesAttributionResponse | null) => {
  if (!attribution) return null;
  return (
    attribution.agentDisplayName?.trim() ||
    attribution.partnerName?.trim() ||
    attribution.internalOfficeName?.trim() ||
    attribution.internalBranchName?.trim() ||
    null
  );
};
