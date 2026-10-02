const DEFAULT_CURRENCY = "ALL";

const FRACTION_DIGITS = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Always two decimals (`ALL 1,728.50`), also for currencies whose ISO default is zero decimals. */
export const formatMoney = (value?: number | null, currency?: string) => {
  if (value == null || Number.isNaN(value)) return "—";
  const ccy = currency?.trim() || DEFAULT_CURRENCY;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ccy,
      ...FRACTION_DIGITS,
    }).format(value);
  } catch {
    return `${formatAmount(value)} ${ccy}`;
  }
};

/** A bare amount with no currency, always two decimals. */
export const formatAmount = (value: number) => value.toLocaleString("en-US", FRACTION_DIGITS);
