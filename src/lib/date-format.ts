import { format, parseISO } from "date-fns";
import { DISPLAY_FORMAT } from "@/components/ui/date-mask";

export const DATE_FORMAT = DISPLAY_FORMAT;
export const DATE_TIME_FORMAT = `${DISPLAY_FORMAT} HH:mm`;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_ZONE = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * A date-only value (`2026-09-28`) is a calendar day and stays on that day.
 * A timestamp is UTC; one that arrives without a zone is read as UTC too
 * (parseISO would otherwise take it as local time) and shown in the browser's time zone.
 */
const parseApiDate = (value: string): Date => {
  const text = value.trim();
  if (DATE_ONLY.test(text)) return parseISO(text);
  const time = text.split("T")[1];
  return parseISO(time !== undefined && !HAS_ZONE.test(time) ? `${text}Z` : text);
};

const formatApiDate = (pattern: string, value?: string | null) => {
  if (!value) return "—";
  try {
    return format(parseApiDate(value), pattern);
  } catch {
    return value;
  }
};

/** `dd/MM/yyyy`. Timestamps are converted to local time first. */
export const formatDate = (value?: string | null) => formatApiDate(DATE_FORMAT, value);

/** `dd/MM/yyyy HH:mm` in the browser's time zone. */
export const formatDateTime = (value?: string | null) => formatApiDate(DATE_TIME_FORMAT, value);

/** Today's date in the browser's time zone as `yyyy-MM-dd` (`toISOString()` would give the UTC day). */
export const todayLocalIsoDate = () => format(new Date(), "yyyy-MM-dd");

/** Local calendar day (`yyyy-MM-dd`) of an API timestamp, for sorting and comparing against date-only values. */
export const toLocalIsoDate = (value?: string | null) => {
  if (!value) return "";
  try {
    return format(parseApiDate(value), "yyyy-MM-dd");
  } catch {
    return "";
  }
};
