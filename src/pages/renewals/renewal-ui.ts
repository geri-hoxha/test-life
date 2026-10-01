import { format, parseISO } from "date-fns";
import type {
  DomainPoliciesPolicyRenewalStatus,
  OffersDateOnlyRangeResponse,
} from "@/api/types";
import { formatPolicyMoney } from "@/pages/policies/policy-ui";

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

/** Renewal amounts are in the policy's currency. When it isn't known, show the bare number rather than assume one. */
export const formatRenewalMoney = (
  value: number | null | undefined,
  currency: string | null | undefined,
) => {
  if (value == null || Number.isNaN(value)) return "—";
  if (!currency?.trim()) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return formatPolicyMoney(value, currency);
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

export const shortRenewalId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

export const renewalDetailPath = (policyId: string, renewalId: string) =>
  `/renewals/${encodeURIComponent(policyId)}/${encodeURIComponent(renewalId)}`;
