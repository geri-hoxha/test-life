import type {
  DomainPoliciesPolicyRenewalStatus,
  OffersDateOnlyRangeResponse,
} from "@/api/types";
import { formatDate, formatDateTime } from "@/lib/date-format";
import { formatAmount } from "@/lib/money-format";
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
  if (!currency?.trim()) return formatAmount(value);
  return formatPolicyMoney(value, currency);
};

export const formatRenewalDate = formatDate;

/** UTC timestamp shown in the browser's time zone. */
export const formatRenewalDateTime = formatDateTime;

export const formatRenewalPeriod = (period?: OffersDateOnlyRangeResponse | null) => {
  if (!period?.startDate && !period?.endDate) return "—";
  return `${formatRenewalDate(period.startDate)} → ${formatRenewalDate(period.endDate)}`;
};

/** A renewal that is finished and no longer holds up the ones after it. */
const isSettledRenewal = (status?: string | null) => status === "applied" || status === "cancelled";

type RenewalSequenceStatus = { targetPeriodSequence?: number | null; status?: string | null };

/**
 * Only the next coverage period of a policy can be started: a planned renewal
 * qualifies once every earlier period has been applied (or cancelled).
 */
export const canStartRenewal = (
  renewal: RenewalSequenceStatus,
  siblings: readonly RenewalSequenceStatus[],
): boolean => {
  if (renewal.status !== "planned" || renewal.targetPeriodSequence == null) return false;
  const sequence = renewal.targetPeriodSequence;
  return !siblings.some(
    (other) =>
      other.targetPeriodSequence != null &&
      other.targetPeriodSequence < sequence &&
      !isSettledRenewal(other.status),
  );
};

export const shortRenewalId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

export const renewalDetailPath = (policyId: string, renewalId: string) =>
  `/renewals/${encodeURIComponent(policyId)}/${encodeURIComponent(renewalId)}`;
