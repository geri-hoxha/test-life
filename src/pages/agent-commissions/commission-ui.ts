import { format, parseISO } from "date-fns";
import type {
  DomainCommissionsBasis,
  DomainCommissionsBusinessType,
  DomainCommissionsEntryType,
} from "@/api/types";

export const COMMISSION_BUSINESS_TYPES: DomainCommissionsBusinessType[] = [
  "newBusiness",
  "renewal",
];

export const COMMISSION_ENTRY_TYPES: DomainCommissionsEntryType[] = [
  "accrual",
  "reversal",
];

export const COMMISSION_BASES: DomainCommissionsBasis[] = [
  "premium",
  "sumInsured",
];

export const humanizeCommissionEnum = (value?: string | null) => {
  if (!value?.trim()) return "—";
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const businessTypeLabel = (value?: DomainCommissionsBusinessType | string) => {
  if (value === "newBusiness") return "New business";
  if (value === "renewal") return "Renewal";
  return value ? humanizeCommissionEnum(value) : "—";
};

export const entryTypeLabel = (value?: DomainCommissionsEntryType | string) => {
  if (value === "accrual") return "Accrual";
  if (value === "reversal") return "Reversal";
  return value ? humanizeCommissionEnum(value) : "—";
};

export const entryTypeClass = (value?: DomainCommissionsEntryType | string) => {
  if (value === "accrual") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  if (value === "reversal") return "bg-rose-500/15 text-rose-800 dark:text-rose-300";
  return "bg-muted text-muted-foreground";
};

export const basisLabel = (value?: DomainCommissionsBasis | string) => {
  if (value === "premium") return "Premium";
  if (value === "sumInsured") return "Sum insured";
  return value ? humanizeCommissionEnum(value) : "—";
};

export const formatCommissionMoney = (value?: number | null, currency?: string) => {
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

export const formatCommissionRate = (rate?: number | null) => {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
};

export const formatCommissionDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

export const shortCommissionId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
