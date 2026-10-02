import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, toLocalIsoDate, todayLocalIsoDate } from "./date-format";

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

describe("formatDate", () => {
  it("shows dd/MM/yyyy", () => {
    expect(formatDate("2026-09-28")).toBe("28/09/2026");
  });

  it("keeps a date-only value on its calendar day", () => {
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
    expect(formatDate("2026-12-31")).toBe("31/12/2026");
  });

  it("converts a UTC timestamp to the local day", () => {
    const iso = "2026-09-28T23:30:00Z";
    expect(formatDate(iso)).toBe(localDate(new Date(iso)));
  });

  it("shows a dash for an empty value and echoes one it cannot read", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("not a date")).toBe("not a date");
  });
});

describe("formatDateTime", () => {
  it("converts a UTC timestamp to local time", () => {
    for (const iso of ["2026-09-28T10:15:00Z", "2025-01-01T00:00:00Z", "2026-03-29T02:30:00.1234567Z"]) {
      const date = new Date(iso);
      expect(formatDateTime(iso)).toBe(`${localDate(date)} ${localTime(date)}`);
    }
  });

  it("honours an explicit offset", () => {
    const iso = "2026-09-28T10:15:00+02:00";
    const date = new Date(iso);
    expect(formatDateTime(iso)).toBe(`${localDate(date)} ${localTime(date)}`);
  });

  it("reads a timestamp without a zone as UTC", () => {
    const date = new Date("2026-09-28T10:15:00Z");
    expect(formatDateTime("2026-09-28T10:15:00")).toBe(`${localDate(date)} ${localTime(date)}`);
  });

  it("shows a dash for an empty value", () => {
    expect(formatDateTime(null)).toBe("—");
  });
});

describe("toLocalIsoDate", () => {
  it("returns the local calendar day of a timestamp", () => {
    const iso = "2026-09-28T23:30:00Z";
    const date = new Date(iso);
    expect(toLocalIsoDate(iso)).toBe(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
  });

  it("passes a date-only value through and is empty for nothing", () => {
    expect(toLocalIsoDate("2026-09-28")).toBe("2026-09-28");
    expect(toLocalIsoDate(null)).toBe("");
  });
});

describe("todayLocalIsoDate", () => {
  it("is the local day, not the UTC day", () => {
    const now = new Date();
    expect(todayLocalIsoDate()).toBe(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
});
