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


export type F5LocationCode = {
  code: string;
  label: string;
};

// Codes used for fiscalization (F5 location codes)
export const F5_LOCATIONS: F5LocationCode[] = [
  { code: "bb123bb123", label: "Tirana — Head Office" },
  { code: "cc234cc234", label: "Tirana — Bllok Branch" },
  { code: "dd345dd345", label: "Durrës Branch" },
  { code: "ee456ee456", label: "Vlorë Branch" },
  { code: "ff567ff567", label: "Shkodër Branch" },
  { code: "gg678gg678", label: "Elbasan Branch" },
  { code: "hh789hh789", label: "Fier Branch" },
  { code: "ii890ii890", label: "Korçë Branch" },
];

export type Customer = {
  id: string;
  customerType: CustomerType;

  // Individual fields
  firstName: string;
  lastName: string;
  fatherName?: string;
  personalId: string; // SSN / National ID (Individual)
  ssnIssuingCountry?: string; // country that issued the SSN
  dateOfBirth: string; // ISO
  gender: Gender;
  nationality?: string;
  placeOfBirth?: string;

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
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  fatherName: z.string().trim().max(80).optional().or(z.literal("")),
  personalId: z.string().trim().max(40).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
  ssnIssuingCountry: z.string().trim().max(80).optional().or(z.literal("")),
  placeOfBirth: z.string().trim().max(120).optional().or(z.literal("")),
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
    const country = c.ssnIssuingCountry || c.country;
    if (!country?.trim() || country === "N/A") {
      ctx.addIssue({ code: "custom", message: "Country is required", path: ["ssnIssuingCountry"] });
    }
  } else {
    if (!c.companyName?.trim()) ctx.addIssue({ code: "custom", message: "Company name is required", path: ["companyName"] });
    if (!c.nipt?.trim()) ctx.addIssue({ code: "custom", message: "NIPT is required", path: ["nipt"] });
    if (!c.nationality?.trim() || c.nationality === "N/A") {
      ctx.addIssue({ code: "custom", message: "Nationality is required", path: ["nationality"] });
    }
    if (!c.country?.trim() || c.country === "N/A") {
      ctx.addIssue({ code: "custom", message: "Country is required", path: ["country"] });
    }
  }
});

const seed: Customer[] = [
  { id: "CUS-0001", customerType: "Individual", firstName: "Arben", lastName: "Hoxha", fatherName: "Petrit", personalId: "AL-TR-J70412900A",
    dateOfBirth: "1970-04-12", gender: "Male", nationality: "Albanian", placeOfBirth: "Tirana",
    f5Location: "bb123bb123", address: "Rruga e Kavajës 88", phone: "+355 69 201 4488", email: "arben.hoxha@example.al",
    occupation: "Civil Engineer", totalExposure: 145000, createdDate: "2025-09-14",
    notes: "Long-standing client of Tirana branch — mortgage protection holder." },
  { id: "CUS-0002", customerType: "Individual", firstName: "Elira", lastName: "Dervishi", fatherName: "Bashkim", personalId: "AL-DR-H85822015B",
    dateOfBirth: "1988-08-22", gender: "Female", nationality: "Albanian", placeOfBirth: "Durrës",
    f5Location: "dd345dd345", address: "Bulevardi Epidamn 14", phone: "+355 68 305 9912", email: "elira.dervishi@example.al",
    occupation: "Senior Government Advisor", totalExposure: 95000, createdDate: "2026-01-30",
    notes: "Advisor at Ministry of Finance." },
  { id: "CUS-0003", customerType: "Individual", firstName: "Dritan", lastName: "Kola", fatherName: "Sokol", personalId: "AL-VL-G65003317C",
    dateOfBirth: "1965-03-03", gender: "Male", nationality: "Albanian", placeOfBirth: "Vlorë",
    f5Location: "ee456ee456", address: "Rruga Justin Godart 5", phone: "+355 69 444 7720", email: "dritan.kola@example.al",
    occupation: "Restaurant Owner", totalExposure: 60000, createdDate: "2024-11-08" },
  { id: "CUS-0004", customerType: "Individual", firstName: "Mira", lastName: "Leka", fatherName: "Gjergj", personalId: "AL-SH-K92517822D",
    dateOfBirth: "1992-05-17", gender: "Female", nationality: "Albanian", placeOfBirth: "Shkodër",
    f5Location: "ff567ff567", address: "Rruga 28 Nëntori 22", phone: "+355 67 818 3300", email: "mira.leka@example.al",
    occupation: "Pharmacist", totalExposure: 0, createdDate: "2026-03-05",
    notes: "Newly onboarded — referred by Arben Hoxha." },
  { id: "CUS-0005", customerType: "Company", firstName: "", lastName: "", personalId: "",
    companyName: "Alb-Trans Logistics Sh.p.k.", nipt: "L72416502K", companyType: "shpk",
    registrationDate: "2012-06-15", legalRepresentative: "Genc Beqiri",
    dateOfBirth: "", gender: "Other",
    f5Location: "bb123bb123", city: "Tirana", country: "Albania",
    address: "Rruga e Durrësit, Km 5", phone: "+355 4 222 7788", email: "info@albtrans.al",
    totalExposure: 320000, createdDate: "2025-07-22",
    notes: "Group life cover for 42 employees." },
];

let customers: Customer[] = [...seed];

export const getCustomer = (id: string) => customers.find((c) => c.id === id);

export const fullName = (c: Customer) =>
  c.customerType === "Company"
    ? (c.companyName ?? "—")
    : `${c.firstName} ${c.lastName}`.trim();
