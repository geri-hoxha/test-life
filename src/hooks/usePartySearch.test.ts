import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { partySearchQueries, usePartySearch } from "./usePartySearch";

// Every people/companies list hook returns this row, so stale cache leaks would show up.
const stalePerson = { id: "p-stale", firstName: "Stale" };
const listPeopleCalls: { query: unknown; enabled?: boolean }[] = [];
const listCompaniesCalls: { query: unknown; enabled?: boolean }[] = [];

vi.mock("@/api/people", () => ({
  useListPeople: (query: unknown, options?: { enabled?: boolean }) => {
    listPeopleCalls.push({ query, enabled: options?.enabled });
    return { data: { items: [stalePerson] }, isFetching: false };
  },
}));

vi.mock("@/api/companies", () => ({
  useListCompanies: (query: unknown, options?: { enabled?: boolean }) => {
    listCompaniesCalls.push({ query, enabled: options?.enabled });
    return { data: { items: [] }, isFetching: false };
  },
}));

const page = { pageNumber: 1, pageSize: 50 };

describe("partySearchQueries", () => {
  it("lists without filters for an empty term", () => {
    expect(partySearchQueries("")).toEqual({ people: page, companies: page });
  });

  it("searches a single name as first OR last name", () => {
    expect(partySearchQueries("Hoxha")).toEqual({
      people: { ...page, firstName: "Hoxha" },
      peopleByLastName: { ...page, lastName: "Hoxha" },
      companies: { ...page, legalName: "Hoxha" },
    });
  });

  it("splits a full name into first and last name", () => {
    expect(partySearchQueries("Geri Van Hoxha")).toEqual({
      people: { ...page, firstName: "Geri", lastName: "Van Hoxha" },
      companies: { ...page, legalName: "Geri Van Hoxha" },
    });
  });

  it("treats a term with digits as a personal ID / NIPT", () => {
    expect(partySearchQueries("J12345678A")).toEqual({
      people: { ...page, personalIdentifier: "J12345678A" },
      companies: { ...page, registrationNumber: "J12345678A" },
    });
  });
});

describe("usePartySearch with requireTerm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    listPeopleCalls.length = 0;
    listCompaniesCalls.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const render = (search: string) =>
    renderHook(({ s }) => usePartySearch(s, { enabled: true, requireTerm: true }), {
      initialProps: { s: search },
    });

  it("does not query or return results before the user types", () => {
    const { result } = render("");

    expect(listPeopleCalls.every((c) => !c.enabled)).toBe(true);
    expect(listCompaniesCalls.every((c) => !c.enabled)).toBe(true);
    expect(result.current.people).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it("queries the typed term only after the debounce", () => {
    const { result, rerender } = render("");

    rerender({ s: "Geri" });
    expect(result.current.isSearching).toBe(true);
    expect(listPeopleCalls.at(-1)?.enabled).toBe(false);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(listPeopleCalls.at(-1)).toEqual({
      query: { ...page, lastName: "Geri" },
      enabled: true,
    });
    expect(listPeopleCalls).toContainEqual({
      query: { ...page, firstName: "Geri" },
      enabled: true,
    });
    expect(listCompaniesCalls.at(-1)).toEqual({
      query: { ...page, legalName: "Geri" },
      enabled: true,
    });
    expect(result.current.people).toEqual([stalePerson]);
  });

  it("drops results immediately when the input is cleared", () => {
    const { result, rerender } = render("Geri");
    act(() => {
      vi.advanceTimersByTime(400);
    });

    rerender({ s: "" });

    expect(result.current.people).toEqual([]);
    expect(listPeopleCalls.at(-1)?.enabled).toBe(false);
  });
});
