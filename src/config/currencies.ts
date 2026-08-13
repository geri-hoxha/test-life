/**
 * App-wide supported currencies.
 * Add or remove codes here to control currency pickers across the application.
 */
export const CURRENCIES = ["EUR", "USD", "ALL"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

/** Returns the configured list of currencies for the application. */
export function getCurrencies(): readonly CurrencyCode[] {
  return CURRENCIES;
}
