/** Map People/Companies API ↔ UI `Customer` shape. Extra UI-only fields are preserved as placeholders. */

import type {
  CompaniesCompanyResponse,
  CompaniesCreateCompanyRequest,
  CompaniesUpdateCompanyRequest,
  PeopleCreatePersonRequest,
  PeoplePersonResponse,
  PeopleUpdatePersonRequest,
} from "../types";
import type { Customer, Gender } from "@/data/customers";
import { toIso3166Alpha2, toIso3166Alpha3 } from "@/lib/iso3166";

const NA = "N/A";

/** Country smart-enum `value` as stored on the API (e.g. `ALB`). */
export const toCountryCode = (value?: string) => {
  if (!value || value === NA) return "";
  return value.trim();
};

/** Company/address `countryCode` is ISO 3166-1 alpha-2 (max 2 chars). */
export const toCompanyCountryCode = (value?: string) => {
  const raw = toCountryCode(value);
  return raw ? toIso3166Alpha2(raw) : "";
};

/** Map a company `countryCode` back to the Country smart-enum value for selects. */
export const fromCompanyCountryCode = (value?: string) => {
  const raw = value?.trim();
  if (!raw) return "";
  return toIso3166Alpha3(raw);
};

/** Look up Country enum `text` for a stored `value` (`ALB` → `Albania`). */
export const countryDisplayName = (
  code?: string,
  options?: { value: string; text: string }[],
) => {
  if (!code || code === NA) return undefined;
  const raw = code.trim();
  const candidates = new Set(
    [raw, raw.toUpperCase(), toIso3166Alpha3(raw), toIso3166Alpha2(raw)].filter(Boolean),
  );
  return (
    options?.find(
      (o) => candidates.has(o.value) || candidates.has(o.value.toUpperCase()),
    )?.text ?? code
  );
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

export const mapPersonToCustomer = (p: PeoplePersonResponse): Customer => ({
  id: p.id ?? "",
  customerType: "Individual",
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  fatherName: p.fatherName ?? "",
  personalId: p.personalIdentifier ?? "",
  dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? "",
  gender: fromApiGender(p.gender),
  nationality: p.nationality ?? "",
  placeOfBirth: p.birthPlace ?? "",
  addressDistrict: p.addressDistrict ?? "",
  profession: p.profession ?? "",
  position: p.position ?? "",
  f5Location: NA,
  address: "",
  city: "",
  country: "",
  phone: "",
  email: "",
  occupation: "",
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
    nationality: "",
    companyName: c.legalName ?? c.tradeName ?? "",
    tradeName: c.tradeName ?? "",
    nipt: c.registrationNumber ?? "",
    companyType: c.companyType,
    registrationDate: "",
    legalRepresentative: "",
    f5Location: NA,
    address: main?.street ?? "",
    city: main?.city ?? "",
    postalCode: main?.postalCode ?? "",
    country: fromCompanyCountryCode(c.countryCode ?? main?.countryCode),
    phone: "",
    email: "",
    occupation: "",
    notes: "",
    totalExposure: 0,
    // Companies GET does not return a created timestamp.
    createdDate: "",
  };
};

const optionalPersonText = (value?: string) => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
};

/** POST/PUT /api/people body — only fields accepted by the API. */
export const customerToCreatePerson = (c: Customer): PeopleCreatePersonRequest => {
  const body: PeopleCreatePersonRequest = {
    firstName: c.firstName.trim(),
    lastName: c.lastName.trim(),
    personalIdentifier: c.personalId.trim(),
    nationality: (c.nationality ?? "").trim(),
    fatherName: optionalPersonText(c.fatherName),
    birthPlace: optionalPersonText(c.placeOfBirth),
    addressDistrict: optionalPersonText(c.addressDistrict),
    profession: optionalPersonText(c.profession),
    position: optionalPersonText(c.position),
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
  registrationNumber: (c.nipt ?? "").trim(),
  countryCode: toCompanyCountryCode(c.country),
  companyType: c.companyType,
});

export const customerToUpdateCompany = (c: Customer): CompaniesUpdateCompanyRequest => ({
  legalName: (c.companyName ?? "").trim(),
  tradeName: (c.tradeName ?? "").trim() || null,
  registrationNumber: (c.nipt ?? "").trim(),
  countryCode: toCompanyCountryCode(c.country),
  companyType: c.companyType,
});

export const mergeCustomers = (
  people: PeoplePersonResponse[] = [],
  companies: CompaniesCompanyResponse[] = []
): Customer[] => [
  ...people.map(mapPersonToCustomer),
  ...companies.map(mapCompanyToCustomer),
];

/** API party type used to choose `/people` vs `/companies` routes. */
export type CustomerPartyType = "person" | "company";

export const toCustomerPartyType = (
  type: Customer["customerType"] | CustomerPartyType
): CustomerPartyType =>
  type === "Company" || type === "company" ? "company" : "person";

export const parseCustomerPartyType = (value: string | null | undefined): CustomerPartyType | null => {
  if (value === "person" || value === "company") return value;
  return null;
};

/** `/people/:id` or `/companies/:id` (append `/edit` when requested). */
export const customerPath = (
  id: string,
  type: Customer["customerType"] | CustomerPartyType,
  opts?: { edit?: boolean }
) => {
  const prefix = toCustomerPartyType(type) === "company" ? "/companies" : "/people";
  return opts?.edit ? `${prefix}/${id}/edit` : `${prefix}/${id}`;
};

/** `/offers/new` prefilled with a customer as participant (and insured when person). */
export const newOfferPath = (
  id: string,
  type: Customer["customerType"] | CustomerPartyType,
) =>
  `/offers/new?customerId=${encodeURIComponent(id)}&type=${toCustomerPartyType(type)}#people`;
