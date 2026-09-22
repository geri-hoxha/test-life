import { addDays, addYears, format, parseISO } from "date-fns";
import type { OffersSubmitOfferLoanPeriodRequest } from "@/api/types";

const toIsoDate = (d: Date) => format(d, "yyyy-MM-dd");

/** Day after an inclusive period end — the next period must start here. */
export const nextAdjacentStart = (periodEnd: string) =>
  toIsoDate(addDays(parseISO(periodEnd), 1));

/** Inclusive 1-year end: start + 1 year − 1 day. */
export const inclusiveYearEnd = (periodStart: string) =>
  toIsoDate(addDays(addYears(parseISO(periodStart), 1), -1));

/**
 * Yearly loan/coverage slices that are chronological and adjacent:
 * each period is inclusive, and the next starts the following day.
 * The last period is clamped to `coverageEnd`.
 */
export const buildYearlyLoanPeriodDates = (
  coverageStart: string,
  coverageEnd: string,
  yearCount?: number,
): { periodStart: string; periodEnd: string }[] => {
  if (!coverageStart) return [];
  const start = parseISO(coverageStart);
  const endLimit = coverageEnd ? parseISO(coverageEnd) : addYears(start, yearCount ?? 1);
  const years =
    yearCount != null && yearCount > 0
      ? Math.floor(yearCount)
      : Math.max(
          1,
          Math.round(
            (endLimit.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          ),
        );

  const rows: { periodStart: string; periodEnd: string }[] = [];
  for (let i = 0; i < years; i++) {
    const periodStart = addYears(start, i);
    if (periodStart >= endLimit) break;
    let periodEnd = addDays(addYears(periodStart, 1), -1);
    const isLast = i === years - 1;
    if (isLast || periodEnd >= endLimit) periodEnd = endLimit;
    if (periodEnd <= periodStart) break;
    rows.push({
      periodStart: toIsoDate(periodStart),
      periodEnd: toIsoDate(periodEnd),
    });
    if (periodEnd >= endLimit) break;
  }
  return rows;
};

/** Rewrite period dates so they stay chronological and adjacent, keeping balances. */
export const makeLoanPeriodsAdjacent = (
  periods: OffersSubmitOfferLoanPeriodRequest[],
): OffersSubmitOfferLoanPeriodRequest[] => {
  const sorted = [...periods]
    .filter((p) => p.periodStart && p.periodEnd)
    .sort((a, b) => (a.periodStart ?? "").localeCompare(b.periodStart ?? ""));
  if (sorted.length === 0) return periods;

  const dates = buildYearlyLoanPeriodDates(
    sorted[0].periodStart!,
    sorted[sorted.length - 1].periodEnd!,
    sorted.length,
  );

  return sorted.map((p, i) => ({
    ...p,
    sequenceNumber: i + 1,
    periodStart: dates[i]?.periodStart ?? p.periodStart,
    periodEnd: dates[i]?.periodEnd ?? p.periodEnd,
  }));
};
