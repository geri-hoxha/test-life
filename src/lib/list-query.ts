/** Drop empty filter values so they are not sent or keyed in React Query. */
export const compactQuery = <T extends Record<string, unknown>>(query: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
};

/** Date input (YYYY-MM-DD) → start of day UTC ISO string. */
export const dateToUtcStart = (date: string) =>
  date.trim() ? `${date.trim()}T00:00:00.000Z` : undefined;

/** Date input (YYYY-MM-DD) → end of day UTC ISO string. */
export const dateToUtcEnd = (date: string) =>
  date.trim() ? `${date.trim()}T23:59:59.999Z` : undefined;

/** Single-day date → noon UTC (for effectiveOnUtc-style filters). */
export const dateToUtcDay = (date: string) =>
  date.trim() ? `${date.trim()}T00:00:00.000Z` : undefined;
