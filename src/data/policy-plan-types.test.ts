import { describe, expect, it } from "vitest";
import { coverageTermMonths, formatCoverageTermMonths } from "./policy-plan-types";

describe("coverageTermMonths", () => {
  it("reads a one-month term as one month, not one year", () => {
    expect(coverageTermMonths("2026-10-01", "2026-10-31")).toBe(1);
    expect(coverageTermMonths("2026-10-01", "2026-11-01")).toBe(1);
    expect(coverageTermMonths("2027-02-01", "2027-02-28")).toBe(1);
  });

  it("reads whole years", () => {
    expect(coverageTermMonths("2026-10-01", "2027-09-30")).toBe(12);
    expect(coverageTermMonths("2026-10-01", "2027-10-01")).toBe(12);
    expect(coverageTermMonths("2026-01-01", "2030-12-31")).toBe(60);
    expect(coverageTermMonths("2026-01-01", "2045-12-31")).toBe(240);
  });

  it("reads months that are not a whole number of years", () => {
    expect(coverageTermMonths("2026-10-01", "2026-12-31")).toBe(3);
    expect(coverageTermMonths("2026-10-01", "2028-03-31")).toBe(18);
  });

  it("is at least one month", () => {
    expect(coverageTermMonths("2026-10-01", "2026-10-01")).toBe(1);
    expect(coverageTermMonths("2026-10-01", "")).toBe(1);
  });
});

describe("formatCoverageTermMonths", () => {
  it("says month or year in the right number", () => {
    expect(formatCoverageTermMonths(1)).toBe("1 month");
    expect(formatCoverageTermMonths(3)).toBe("3 months");
    expect(formatCoverageTermMonths(12)).toBe("1 year");
    expect(formatCoverageTermMonths(60)).toBe("5 years");
  });
});
