import { format, parseISO } from "date-fns";
import type {
  DomainInvoicesInvoiceStatus,
  DomainInvoicesInvoiceType,
  InvoicesServicePeriod,
} from "@/api/types";

export const INVOICE_STATUSES: DomainInvoicesInvoiceStatus[] = [
  "pending",
  "failed",
  "fiscalized",
];

export const INVOICE_TYPES: DomainInvoicesInvoiceType[] = ["credit", "sale"];

export const invoiceStatusLabel = (status?: DomainInvoicesInvoiceStatus | string) => {
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  if (status === "fiscalized") return "Fiscalized";
  return status ? humanizeInvoiceEnum(status) : "—";
};

export const invoiceTypeLabel = (type?: DomainInvoicesInvoiceType | string) => {
  if (type === "credit") return "Credit";
  if (type === "sale") return "Sale";
  return type ? humanizeInvoiceEnum(type) : "—";
};

export const invoiceStatusClass = (status?: DomainInvoicesInvoiceStatus | string) => {
  if (status === "pending") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "failed") return "bg-destructive/15 text-destructive";
  if (status === "fiscalized") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  return "bg-muted text-muted-foreground";
};

export const invoiceTypeClass = (type?: DomainInvoicesInvoiceType | string) => {
  if (type === "credit") return "bg-rose-500/15 text-rose-800 dark:text-rose-300";
  if (type === "sale") return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
  return "bg-muted text-muted-foreground";
};

export const formatInvoiceMoney = (value?: number | null, currency?: string) => {
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

export const formatInvoiceDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso;
  }
};

export const formatInvoiceDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

export const formatServicePeriod = (period?: InvoicesServicePeriod | null) => {
  if (!period?.startDate && !period?.endDate) return "—";
  return `${formatInvoiceDate(period.startDate)} → ${formatInvoiceDate(period.endDate)}`;
};

export const humanizeInvoiceEnum = (value?: string | null) => {
  if (!value?.trim()) return "—";
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const shortInvoiceId = (id: string) =>
  id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
