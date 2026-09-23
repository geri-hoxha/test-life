import { format, isValid, parse } from "date-fns";

export const DISPLAY_FORMAT = "dd/MM/yyyy";

const PARSE_FORMATS = [
  "dd/MM/yyyy",
  "d/M/yyyy",
  "dd-MM-yyyy",
  "d-M-yyyy",
  "dd.MM.yyyy",
  "d.M.yyyy",
  "yyyy-MM-dd",
  "yyyy/MM/dd",
];

export function formatDisplayDate(date: Date | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, DISPLAY_FORMAT);
}

function dateFromParts(year: number, month: number, day: number): Date | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return undefined;
  const date = new Date(year, month - 1, day);
  if (
    isValid(date) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  ) {
    return date;
  }
  return undefined;
}

export function parseDateInput(raw: string): Date | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  for (const fmt of PARSE_FORMATS) {
    const parsed = parse(text, fmt, new Date());
    if (isValid(parsed) && format(parsed, fmt) === text) return parsed;
  }
  const loose = text.match(/^(\d{1,4})[/.\\-](\d{1,2})[/.\\-](\d{1,4})$/);
  if (loose) {
    const a = Number(loose[1]);
    const b = Number(loose[2]);
    const c = Number(loose[3]);
    if (loose[1].length === 4) return dateFromParts(a, b, c);
    if (loose[3].length === 4) return dateFromParts(c, b, a);
    return undefined;
  }
  if (/^\d{8}$/.test(text)) {
    const day = Number(text.slice(0, 2));
    const month = Number(text.slice(2, 4));
    const year = Number(text.slice(4));
    return (
      dateFromParts(year, month, day) ??
      dateFromParts(Number(text.slice(0, 4)), Number(text.slice(4, 6)), Number(text.slice(6)))
    );
  }
  return undefined;
}
