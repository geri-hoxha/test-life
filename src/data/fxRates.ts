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

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "ALL", "RSD", "BAM", "HRK"] as const;

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
  { id: "fx-7", date: daysAgo(3), fromCurrency: "EUR", toCurrency: "USD", rate: 1.0810, source: "Manual", enteredBy: "Erin Hoxha", reason: "Corporate hedging rate", notes: "Used for Q2 corporate offers" },
  { id: "fx-8", date: daysAgo(2), fromCurrency: "EUR", toCurrency: "RSD", rate: 117.21, source: "Automatic", enteredBy: "NBS Feed" },
  { id: "fx-9", date: daysAgo(0), fromCurrency: "EUR", toCurrency: "RSD", rate: 117.18, source: "Automatic", enteredBy: "NBS Feed" },
  { id: "fx-10", date: daysAgo(5), fromCurrency: "USD", toCurrency: "EUR", rate: 0.9221, source: "Automatic", enteredBy: "ECB Feed" },
  { id: "fx-11", date: daysAgo(0), fromCurrency: "EUR", toCurrency: "ALL", rate: 98.45, source: "Automatic", enteredBy: "BoA Feed" },
  { id: "fx-12", date: daysAgo(1), fromCurrency: "EUR", toCurrency: "ALL", rate: 98.32, source: "Automatic", enteredBy: "BoA Feed" },
  { id: "fx-13", date: daysAgo(0), fromCurrency: "ALL", toCurrency: "EUR", rate: 0.010157, source: "Automatic", enteredBy: "BoA Feed" },
  { id: "fx-14", date: daysAgo(3), fromCurrency: "EUR", toCurrency: "ALL", rate: 98.10, source: "Manual", enteredBy: "Erin Hoxha", reason: "Bank partner lock rate" },
];

export const listFxRates = () => [...rates].sort((a, b) => (a.date < b.date ? 1 : -1));

export const addFxRate = (r: Omit<FxRate, "id" | "source" | "enteredBy"> & { source?: FxSource; enteredBy?: string }) => {
  const next: FxRate = {
    id: `fx-${Date.now()}`,
    source: r.source ?? "Manual",
    enteredBy: r.enteredBy ?? "Erin Hoxha",
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

/**
 * Latest usable rate for a pair. If the direct pair is missing, derive from the inverse
 * (e.g. ALL→EUR from EUR→ALL).
 */
export const resolveRate = (
  from: string,
  to: string,
): { rate: number; source: FxSource | "n/a"; inverted: boolean; entry?: FxRate } | undefined => {
  if (from === to) return { rate: 1, source: "n/a", inverted: false };
  const direct = getLatestRate(from, to);
  if (direct) return { rate: direct.rate, source: direct.source, inverted: false, entry: direct };
  const inverse = getLatestRate(to, from);
  if (inverse && inverse.rate !== 0) {
    return { rate: 1 / inverse.rate, source: inverse.source, inverted: true, entry: inverse };
  }
  return undefined;
};

/** All candidate rates for a pair (newest first), used for manual override selection on offers. */
export const getRatesForPair = (from: string, to: string): FxRate[] => {
  const direct = rates
    .filter((r) => r.fromCurrency === from && r.toCurrency === to)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (direct.length > 0) return direct;

  // Surface inverse quotes as selectable candidates (rate inverted for display/use).
  return rates
    .filter((r) => r.fromCurrency === to && r.toCurrency === from && r.rate !== 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((r) => ({
      ...r,
      id: `${r.id}-inv`,
      fromCurrency: from,
      toCurrency: to,
      rate: 1 / r.rate,
      notes: r.notes ? `${r.notes} (inverted)` : "Inverted from reverse pair",
    }));
};

export const convert = (amount: number, from: string, to: string, overrideRate?: number) => {
  if (from === to) return { amount, rate: 1, source: "n/a" as const };
  if (overrideRate != null && overrideRate > 0) {
    return { amount: amount * overrideRate, rate: overrideRate, source: "Override" as const };
  }
  const resolved = resolveRate(from, to);
  if (!resolved) return { amount: NaN, rate: NaN, source: "missing" as const };
  return { amount: amount * resolved.rate, rate: resolved.rate, source: resolved.source };
};
