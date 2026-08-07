/** Map People/Companies API ↔ UI `Customer` shape. Extra UI-only fields are preserved as placeholders. */

import type {
  CompaniesCompanyResponse,
  CompaniesCreateCompanyRequest,
  CompaniesUpdateCompanyRequest,
  DomainPartiesEnumsCompanyType,
  PeopleCreatePersonRequest,
  PeoplePersonResponse,
  PeopleUpdatePersonRequest,
} from "../types";
import type { CompanyType, Customer, Gender, PEPStatus } from "@/data/customers";

const NA = "N/A";

const companyTypeToApi: Record<string, DomainPartiesEnumsCompanyType> = {
  "Person Fizik": "soleProprietor",
  "Sh.p.k.": "shpk",
  "Sh.a.": "sha",
  "Person Juridik": "other",
  Ortakeri: "association",
  "Dega e shoqërisë së huaj": "branchOfForeignCompany",
};

const companyTypeFromApi: Record<DomainPartiesEnumsCompanyType, CompanyType> = {
  soleProprietor: "Person Fizik",
  shpk: "Sh.p.k.",
  sha: "Sh.a.",
  publicInstitution: "Person Juridik",
  municipality: "Person Juridik",
  association: "Ortakeri",
  foundation: "Ortakeri",
  branchOfForeignCompany: "Dega e shoqërisë së huaj",
  other: "Person Juridik",
};

const countryToCode: Record<string, string> = {
  Albania: "AL",
  Kosovo: "XK",
  "North Macedonia": "MK",
  Montenegro: "ME",
  Greece: "GR",
  Italy: "IT",
  Germany: "DE",
  France: "FR",
  "United Kingdom": "GB",
  "United States": "US",
  Turkey: "TR",
  AL: "AL",
};

const codeToCountry: Record<string, string> = {
  AL: "Albania",
  XK: "Kosovo",
  MK: "North Macedonia",
  ME: "Montenegro",
  GR: "Greece",
  IT: "Italy",
  DE: "Germany",
  FR: "France",
  GB: "United Kingdom",
  US: "United States",
  TR: "Turkey",
};

export const toCountryCode = (value?: string) => {
  if (!value || value === NA) return "AL";
  return countryToCode[value] ?? (value.length === 2 ? value.toUpperCase() : "AL");
};

export const fromCountryCode = (code?: string) => {
  if (!code) return NA;
  return codeToCountry[code.toUpperCase()] ?? code;
};

export const toApiGender = (g?: Gender | string) => {
  if (g === "Male") return "male" as const;
  if (g === "Female") return "female" as const;
  return undefined;
};

export const fromApiGender = (g?: string): Gender => {
  if (g === "male") return "Male";
  if (g === "female") return "Female";
  return "Other";
};

export const toApiPep = (p?: PEPStatus) => p === "Yes";
export const fromApiPep = (isPep?: boolean): PEPStatus =>
  isPep === true ? "Yes" : isPep === false ? "No" : "Unknown";

export const mapPersonToCustomer = (p: PeoplePersonResponse): Customer => ({
  id: p.id ?? "",
  customerType: "Individual",
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  fatherName: "",
  personalId: p.personalIdentifier ?? "",
  ssnIssuingCountry: fromCountryCode(p.countryCode),
  dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? "",
  gender: fromApiGender(p.gender),
  nationality: NA,
  placeOfBirth: "",
  f5Location: NA,
  address: "",
  city: "",
  country: fromCountryCode(p.countryCode),
  phone: "",
  email: "",
  occupation: "",
  pepStatus: fromApiPep(p.isPep),
  notes: "",
  totalExposure: 0,
  // People GET does not return a created timestamp.
  createdDate: "",
});

export const mapCompanyToCustomer = (c: CompaniesCompanyResponse): Customer => {
  const main = c.addresses?.find((a) => a.isMain) ?? c.addresses?.[0];
  return {
    id: c.id ?? "",
    customerType: "Company",
    firstName: "",
    lastName: "",
    personalId: "",
    dateOfBirth: "",
    gender: "Other",
    companyName: c.legalName ?? c.tradeName ?? "",
    tradeName: c.tradeName ?? "",
    nipt: c.registrationNumber ?? "",
    companyType: c.companyType ? companyTypeFromApi[c.companyType] : undefined,
    registrationDate: "",
    legalRepresentative: "",
    f5Location: NA,
    address: main?.street ?? "",
    city: main?.city ?? "",
    postalCode: main?.postalCode ?? "",
    country: fromCountryCode(c.countryCode ?? main?.countryCode),
    phone: "",
    email: "",
    occupation: "",
    pepStatus: "Unknown",
    notes: "",
    totalExposure: 0,
    // Companies GET does not return a created timestamp.
    createdDate: "",
  };
};

/** POST/PUT /api/people body — only fields accepted by the API. */
export const customerToCreatePerson = (c: Customer): PeopleCreatePersonRequest => {
  const body: PeopleCreatePersonRequest = {
    firstName: c.firstName.trim(),
    lastName: c.lastName.trim(),
    personalIdentifier: c.personalId.trim(),
    countryCode: toCountryCode(c.ssnIssuingCountry || c.country),
    isPep: toApiPep(c.pepStatus),
  };
  if (c.dateOfBirth) body.dateOfBirth = c.dateOfBirth;
  const gender = toApiGender(c.gender);
  if (gender) body.gender = gender;
  return body;
};

export const customerToUpdatePerson = (c: Customer): PeopleUpdatePersonRequest =>
  customerToCreatePerson(c);

export const customerToCreateCompany = (c: Customer): CompaniesCreateCompanyRequest => ({
  legalName: (c.companyName ?? "").trim(),
  tradeName: (c.tradeName ?? "").trim() || null,
  registrationNumber: (c.nipt ?? "").trim(),
  countryCode: toCountryCode(c.country),
  companyType:
    c.companyType && c.companyType !== (NA as CompanyType)
      ? companyTypeToApi[c.companyType]
      : undefined,
});

export const customerToUpdateCompany = (c: Customer): CompaniesUpdateCompanyRequest =>
  customerToCreateCompany(c);

export const mergeCustomers = (
  people: PeoplePersonResponse[] = [],
  companies: CompaniesCompanyResponse[] = []
): Customer[] => [
  ...people.map(mapPersonToCustomer),
  ...companies.map(mapCompanyToCustomer),
];

/** API party type used in customer detail/edit URLs (`?type=`). */
export type CustomerPartyType = "person" | "company";

export const toCustomerPartyType = (
  type: Customer["customerType"] | CustomerPartyType
): CustomerPartyType =>
  type === "Company" || type === "company" ? "company" : "person";

export const parseCustomerPartyType = (value: string | null | undefined): CustomerPartyType | null => {
  if (value === "person" || value === "company") return value;
  return null;
};

/** `/customers/:id` or `/customers/:id/edit` with `?type=person|company`. */
export const customerPath = (
  id: string,
  type: Customer["customerType"] | CustomerPartyType,
  opts?: { edit?: boolean }
) => {
  const base = opts?.edit ? `/customers/${id}/edit` : `/customers/${id}`;
  return `${base}?type=${toCustomerPartyType(type)}`;
};

/** `/offers/new` prefilled with a customer as participant (and insured when person). */
export const newOfferPath = (
  id: string,
  type: Customer["customerType"] | CustomerPartyType,
) =>
  `/offers/new?customerId=${encodeURIComponent(id)}&type=${toCustomerPartyType(type)}#people`;
