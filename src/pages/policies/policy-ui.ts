import type {
  DomainBillingPremiumInstallmentStatus,
  DomainPoliciesCancellationKind,
  DomainPoliciesPolicyCancellationStatus,
  DomainPoliciesPolicyPeriodStatus,
  DomainPoliciesPolicyStatus,
  OffersDateOnlyRangeResponse,
  PoliciesInvoiceRecipientResponse,
  PoliciesPolicyResponse,
} from "@/api/types";
import { formatDate, formatDateTime, toLocalIsoDate } from "@/lib/date-format";
import { formatMoney } from "@/lib/money-format";

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

/** A lapsed, cancelled, or matured policy is already over, so a new cancellation cannot be started. */
export const isPolicyCancellable = (status?: DomainPoliciesPolicyStatus | string | null) =>
  status !== "lapsed" && status !== "cancelled" && status !== "matured";

export const policyStatusClass =(status?: DomainPoliciesPolicyStatus | string | null) => {
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

/** The premium actually charged on a policy: a cancelled period is no longer charged, so it stays out of the total. */
export const totalChargePremium = (
  periods: readonly { status?: string | null; chargePremium?: number | null }[],
) =>
  periods
    .filter((period) => period.status !== "cancelled")
    .reduce((sum, period) => sum + (period.chargePremium ?? 0), 0);

export const BILLED_IN_LEGACY_LABEL = "Billed in legacy";

/**
 * A period migrated from legacy carries its legacy policy number, and legacy already billed
 * its installments, which this system still holds as "ready to invoice".
 */
export const isBilledInLegacy = (
  installment: { status?: string | null; coveragePeriodSequence?: number | null },
  periods: readonly { sequenceNumber?: number; legacyPolicyNumber?: string | number | null }[],
) =>
  installment.status === "readyToInvoice" &&
  installment.coveragePeriodSequence != null &&
  periods.some(
    (period) =>
      period.sequenceNumber === installment.coveragePeriodSequence &&
      // The API may send the legacy number as a JSON number rather than a string.
      String(period.legacyPolicyNumber ?? "").trim() !== "",
  );

export const formatPolicyMoney = formatMoney;

export const formatPolicyDate = formatDate;

/** UTC timestamp shown in the browser's time zone. */
export const formatPolicyDateTime = formatDateTime;

export const formatCoverageTerm =(term?: OffersDateOnlyRangeResponse | null) => {
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

export type PayerHistoryEntry = {
  key: string;
  /** `YYYY-MM-DD` from which this party was invoiced. */
  effectiveFrom: string;
  payer: PoliciesInvoiceRecipientResponse;
  isCurrent: boolean;
  /** The payer named when the policy was issued, when the recorded history does not already start with them. */
  isIssuePayer: boolean;
};

/**
 * Who has been invoiced over the life of a policy, newest first. The recorded
 * changes are shown as-is; the payer at issue is added at the end only when
 * the history does not already begin with them.
 */
export const buildPayerHistory = (
  policy?: Pick<
    PoliciesPolicyResponse,
    "issuedOnUtc" | "participants" | "invoiceRecipients" | "currentInvoiceRecipient"
  > | null,
): PayerHistoryEntry[] => {
  if (!policy) return [];
  const changes = [...(policy.invoiceRecipients ?? [])].sort(
    (a, b) =>
      (a.effectiveFrom ?? "").localeCompare(b.effectiveFrom ?? "") || (a.id ?? 0) - (b.id ?? 0),
  );
  if (changes.length === 0) return [];

  const entries: PayerHistoryEntry[] = changes.map((c, i) => ({
    key: `change-${c.id ?? i}`,
    effectiveFrom: c.effectiveFrom ?? "",
    payer: c,
    isCurrent: false,
    isIssuePayer: false,
  }));

  const issuePayer = policy.participants?.find((p) => p.role === "invoiced");
  if (issuePayer && issuePayer.partyId !== changes[0].partyId) {
    entries.unshift({
      key: "issue",
      effectiveFrom: toLocalIsoDate(policy.issuedOnUtc),
      payer: issuePayer,
      isCurrent: false,
      isIssuePayer: true,
    });
  }

  const currentId = policy.currentInvoiceRecipient?.partyId;
  const current = [...entries].reverse().find((e) => e.payer.partyId === currentId);
  if (current) current.isCurrent = true;

  return entries.reverse();
};
