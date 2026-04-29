export type FxSource = "Automatic" | "Manual";

export type FxRate = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: FxSource;
  enteredBy: string;
  reason?: string;
  notes?: string;
};

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "RSD", "BAM", "HRK"] as const;

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};

let rates: FxRate[] = [
  { id: "fx-1", date: daysAgo(0), fromCurrency: "EUR", toCurrency: "USD", rate: 1.0842, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-2", date: daysAgo(0), fromCurrency: "EUR", toCurrency: "GBP", rate: 0.8567, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-3", date: daysAgo(0), fromCurrency: "EUR", toCurrency: "CHF", rate: 0.9612, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-4", date: daysAgo(1), fromCurrency: "EUR", toCurrency: "USD", rate: 1.0821, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-5", date: daysAgo(1), fromCurrency: "EUR", toCurrency: "GBP", rate: 0.8551, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-6", date: daysAgo(2), fromCurrency: "EUR", toCurrency: "USD", rate: 1.0798, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-7", date: daysAgo(3), fromCurrency: "EUR", toCurrency: "USD", rate: 1.0810, source: "Manual", enteredBy: "Anna Kovač", reason: "Corporate hedging rate", notes: "Used for Q2 corporate offers" },
  { id: "fx-8", date: daysAgo(2), fromCurrency: "EUR", toCurrency: "RSD", rate: 117.21, source: "Automatic", enteredBy: "NBS Feed" },
  { id: "fx-9", date: daysAgo(0), fromCurrency: "EUR", toCurrency: "RSD", rate: 117.18, source: "Automatic", enteredBy: "NBS Feed" },
  { id: "fx-10", date: daysAgo(5), fromCurrency: "USD", toCurrency: "EUR", rate: 0.9221, source: "Automatic", enteredBy: "ECB Feed" },
];

export const listFxRates = () => [...rates].sort((a, b) => (a.date < b.date ? 1 : -1));

export const addFxRate = (r: Omit<FxRate, "id" | "source" | "enteredBy"> & { source?: FxSource; enteredBy?: string }) => {
  const next: FxRate = {
    id: `fx-${Date.now()}`,
    source: r.source ?? "Manual",
    enteredBy: r.enteredBy ?? "Anna Kovač",
    ...r,
  };
  rates = [next, ...rates];
  return next;
};

export const deleteFxRate = (id: string) => {
  rates = rates.filter((r) => r.id !== id);
};

/** Latest rate for a pair (Manual takes precedence on the same date). */
export const getLatestRate = (from: string, to: string): FxRate | undefined => {
  if (from === to) return undefined;
  const matches = rates.filter((r) => r.fromCurrency === from && r.toCurrency === to);
  if (!matches.length) return undefined;
  return [...matches].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.source !== b.source) return a.source === "Manual" ? -1 : 1;
    return 0;
  })[0];
};

/** All candidate rates for a pair (newest first), used for manual override selection on offers. */
export const getRatesForPair = (from: string, to: string): FxRate[] => {
  return rates
    .filter((r) => r.fromCurrency === from && r.toCurrency === to)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const convert = (amount: number, from: string, to: string, overrideRate?: number) => {
  if (from === to) return { amount, rate: 1, source: "n/a" as const };
  if (overrideRate) return { amount: amount * overrideRate, rate: overrideRate, source: "Override" as const };
  const latest = getLatestRate(from, to);
  if (!latest) return { amount: NaN, rate: NaN, source: "missing" as const };
  return { amount: amount * latest.rate, rate: latest.rate, source: latest.source };
};
