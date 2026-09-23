import { describe, expect, it } from "vitest";
import { formatDisplayDate, parseDateInput } from "@/components/ui/date-mask";

describe("parseDateInput", () => {
  it("keeps day and month in dd/mm/yyyy order", () => {
    const date = parseDateInput("1/2/2026");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(1);
    expect(date?.getDate()).toBe(1);
    expect(formatDisplayDate(date)).toBe("01/02/2026");
  });

  it("accepts an 8-digit day-month-year", () => {
    expect(formatDisplayDate(parseDateInput("15092026"))).toBe("15/09/2026");
  });

  it("does not parse a half-finished date", () => {
    expect(parseDateInput("15/1")).toBeUndefined();
    expect(parseDateInput("15/09/202")).toBeUndefined();
  });
});
