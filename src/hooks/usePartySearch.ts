import { useMemo } from "react";
import { useListPeople, type ListPeopleQuery } from "@/api/people";
import { useListCompanies, type ListCompaniesQuery } from "@/api/companies";
import type { CompaniesCompanyResponse, PeoplePersonResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 50;
const NO_PEOPLE: PeoplePersonResponse[] = [];
const NO_COMPANIES: CompaniesCompanyResponse[] = [];

type PartySearchQueries = {
  people: ListPeopleQuery;
  /** Second people lookup so a single name matches either first or last name. */
  peopleByLastName?: ListPeopleQuery;
  companies: ListCompaniesQuery;
};

/**
 * Maps a search term to list-endpoint filters:
 * - "J12345678A" (contains a digit) → personal ID / company registration number
 * - "Hoxha"      → people by first OR last name, companies by legal name
 * - "Geri Hoxha" → people by first AND last name, companies by legal name
 */
export const partySearchQueries = (term: string): PartySearchQueries => {
  const page = { pageNumber: 1, pageSize: PAGE_SIZE };
  if (!term) return { people: page, companies: page };

  if (/\d/.test(term)) {
    return {
      people: compactQuery({ ...page, personalIdentifier: term }),
      companies: compactQuery({ ...page, registrationNumber: term }),
    };
  }

  const companies = compactQuery({ ...page, legalName: term });
  const [first, ...rest] = term.split(/\s+/);
  if (rest.length > 0) {
    return {
      people: compactQuery({ ...page, firstName: first, lastName: rest.join(" ") }),
      companies,
    };
  }
  return {
    people: compactQuery({ ...page, firstName: term }),
    peopleByLastName: compactQuery({ ...page, lastName: term }),
    companies,
  };
};

/**
 * Debounced server-side party search. Requests fire only after the user stops
 * typing; `isSearching` covers both the debounce wait and the in-flight fetch.
 * With `requireTerm`, nothing is fetched until the user has typed something.
 */
export function usePartySearch(
  search: string,
  {
    enabled,
    includeCompanies = true,
    requireTerm = false,
  }: { enabled: boolean; includeCompanies?: boolean; requireTerm?: boolean },
) {
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  const queries = useMemo(() => partySearchQueries(debouncedTerm), [debouncedTerm]);
  const active = enabled && (!requireTerm || (term !== "" && debouncedTerm !== ""));
  const byLastNameEnabled = active && queries.peopleByLastName !== undefined;

  const byName = useListPeople(queries.people, { enabled: active });
  const byLastName = useListPeople(queries.peopleByLastName, { enabled: byLastNameEnabled });
  const companiesList = useListCompanies(queries.companies, {
    enabled: active && includeCompanies,
  });

  const people = useMemo<PeoplePersonResponse[]>(() => {
    // Inactive queries can still expose keepPreviousData results from an earlier
    // term, so only read results from lookups that are currently enabled.
    if (!active) return NO_PEOPLE;
    const primary = byName.data?.items ?? [];
    const secondary = byLastNameEnabled ? (byLastName.data?.items ?? []) : [];
    const seen = new Set(primary.map((p) => p.id));
    return [...primary, ...secondary.filter((p) => !seen.has(p.id))];
  }, [active, byName.data?.items, byLastName.data?.items, byLastNameEnabled]);

  const companies = (active && includeCompanies && companiesList.data?.items) || NO_COMPANIES;

  const isSearching =
    term !== debouncedTerm ||
    (active &&
      (byName.isFetching ||
        (byLastNameEnabled && byLastName.isFetching) ||
        (includeCompanies && companiesList.isFetching)));

  return { people, companies, isSearching };
}
