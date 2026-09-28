import { z } from "zod";

export type Gender = "Male" | "Female" | "Other";
export type CustomerType = "Individual" | "Company";
export type CompanyType =
  | "soleProprietor"
  | "shpk"
  | "sha"
  | "publicInstitution"
  | "municipality"
  | "association"
  | "foundation"
  | "branchOfForeignCompany"
  | "other";

export type CompanyTypeOption = {
  value: CompanyType;
  text: string;
};

export const COMPANY_TYPE_OPTIONS: CompanyTypeOption[] = [
  { value: "soleProprietor", text: "Sole proprietor" },
  { value: "shpk", text: "Sh.p.k." },
  { value: "sha", text: "Sh.a." },
  { value: "publicInstitution", text: "Public institution" },
  { value: "municipality", text: "Municipality" },
  { value: "association", text: "Association" },
  { value: "foundation", text: "Foundation" },
  { value: "branchOfForeignCompany", text: "Branch of foreign company" },
  { value: "other", text: "Other" },
];

export const companyTypeLabel = (value?: string | null) =>
  COMPANY_TYPE_OPTIONS.find((o) => o.value === value)?.text ?? value ?? "";


export type Customer = {
  id: string;
  customerType: CustomerType;

  // Individual fields
  firstName: string;
  lastName: string;
  fatherName?: string;
  personalId: string; // SSN / National ID (Individual)
  ssnIssuingCountry?: string; // unused for people — countryCode is no longer on the person API
  dateOfBirth: string; // ISO
  gender: Gender;
  nationality?: string;
  placeOfBirth?: string;
  addressDistrict?: string;
  profession?: string;
  position?: string;

  // Company fields
  companyName?: string;
  tradeName?: string;
  nipt?: string;
  companyType?: CompanyType;
  registrationDate?: string;
  legalRepresentative?: string;

  // Shared
  f5Location?: string; // F5 location code
  address?: string;
  city?: string;       // company only (main address summary)
  postalCode?: string; // company address (main address summary)
  country?: string;    // company countryCode
  phone?: string;
  email?: string;
  occupation?: string;
  notes?: string;
  totalExposure: number;
  createdDate: string;
};

export const ageFromDob = (iso: string) => {
  if (!iso) return 0;
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
};

export const customerSchema = z.object({
  customerType: z.enum(["Individual", "Company"]),
  firstName: z.string().trim().max(256).optional().or(z.literal("")),
  lastName: z.string().trim().max(256).optional().or(z.literal("")),
  fatherName: z.string().trim().max(256).optional().or(z.literal("")),
  personalId: z.string().trim().max(64).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
  ssnIssuingCountry: z.string().trim().max(80).optional().or(z.literal("")),
  placeOfBirth: z.string().trim().max(256).optional().or(z.literal("")),
  addressDistrict: z.string().trim().max(256).optional().or(z.literal("")),
  profession: z.string().trim().max(256).optional().or(z.literal("")),
  position: z.string().trim().max(256).optional().or(z.literal("")),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  nipt: z.string().trim().max(30).optional().or(z.literal("")),
  companyType: z.string().optional(),
  registrationDate: z.string().optional().or(z.literal("")),
  legalRepresentative: z.string().trim().max(120).optional().or(z.literal("")),
  f5Location: z.string().optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  occupation: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
}).superRefine((c, ctx) => {
  if (c.customerType === "Individual") {
    if (!c.firstName?.trim()) ctx.addIssue({ code: "custom", message: "First name is required", path: ["firstName"] });
    if (!c.lastName?.trim()) ctx.addIssue({ code: "custom", message: "Last name is required", path: ["lastName"] });
    if (!c.personalId?.trim()) ctx.addIssue({ code: "custom", message: "SSN / Personal ID is required", path: ["personalId"] });
    if (!c.dateOfBirth) ctx.addIssue({ code: "custom", message: "Date of birth is required", path: ["dateOfBirth"] });
    if (!c.nationality?.trim() || c.nationality === "N/A") {
      ctx.addIssue({ code: "custom", message: "Nationality is required", path: ["nationality"] });
    }
  } else {
    if (!c.companyName?.trim()) ctx.addIssue({ code: "custom", message: "Company name is required", path: ["companyName"] });
    if (!c.nipt?.trim()) ctx.addIssue({ code: "custom", message: "NIPT is required", path: ["nipt"] });
    if (!c.country?.trim() || c.country === "N/A") {
      ctx.addIssue({ code: "custom", message: "Country is required", path: ["country"] });
    }
  }
});

export const fullName = (c: Customer) =>
  c.customerType === "Company"
    ? (c.companyName ?? "—")
    : `${c.firstName} ${c.lastName}`.trim();
