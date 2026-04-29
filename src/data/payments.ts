import { listPolicies, getPolicy, Policy } from "./policies";

export type PaymentMethod = "Cash" | "Bank Transfer" | "Card";
export type PaymentStatus = "Unpaid" | "Paid" | "Partially Paid";

export type PaymentRecord = {
  id: string;
  policyId: string;
  year: number;
  amount: number;
  currency: string;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
};

export type ScheduleRow = {
  policyId: string;
  policyNumber: string;
  year: number;
  dueDate: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAmount: number;
  lastPaymentDate?: string;
};

let payments: PaymentRecord[] = [];

export const listPayments = () => [...payments].sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
export const listPaymentsForPolicy = (policyId: string) =>
  payments.filter((p) => p.policyId === policyId).sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));

export const recordPayment = (p: Omit<PaymentRecord, "id">) => {
  const id = `PAY-${String(payments.length + 1).padStart(4, "0")}`;
  payments = [{ id, ...p }, ...payments];
  return id;
};

const yearlyDue = (policy: Policy, yearIdx: number) => {
  if (policy.paymentMode === "Pay all years upfront") return yearIdx === 0 ? policy.premium * policy.termYears : 0;
  if (policy.paymentMode === "Pay first year only") return yearIdx === 0 ? policy.premium : 0;
  return policy.premium;
};

export const getScheduleForPolicy = (policyId: string): ScheduleRow[] => {
  const policy = getPolicy(policyId);
  if (!policy) return [];
  const startYear = new Date(policy.startDate).getFullYear();
  const mmdd = policy.startDate.slice(5);
  return Array.from({ length: policy.termYears }, (_, i) => {
    const amount = yearlyDue(policy, i);
    const yearPayments = payments.filter((p) => p.policyId === policyId && p.year === i + 1);
    const paidAmount = yearPayments.reduce((s, p) => s + p.amount, 0);
    let status: PaymentStatus = "Unpaid";
    if (amount === 0) status = "Paid";
    else if (paidAmount >= amount) status = "Paid";
    else if (paidAmount > 0) status = "Partially Paid";
    const last = yearPayments.sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1))[0];
    return {
      policyId,
      policyNumber: policy.number,
      year: i + 1,
      dueDate: `${startYear + i}-${mmdd}`,
      amount,
      currency: policy.currency,
      status,
      paidAmount,
      lastPaymentDate: last?.paymentDate,
    };
  });
};

export const getAllSchedules = (): ScheduleRow[] =>
  listPolicies().flatMap((p) => getScheduleForPolicy(p.id));

export const paymentStatusColor: Record<PaymentStatus, string> = {
  "Unpaid": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Paid": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Partially Paid": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
};
