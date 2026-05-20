import { z } from "zod";

export type Gender = "Male" | "Female" | "Other";
export type PEPStatus = "Unknown" | "No" | "Yes";
export type CustomerType = "Individual" | "Company";
export type CompanyType =
  | "Person Fizik"
  | "Sh.p.k."
  | "Sh.a."
  | "Person Juridik"
  | "Ortakeri"
  | "Dega e shoqërisë së huaj";

export const COMPANY_TYPES: CompanyType[] = [
  "Person Fizik",
  "Sh.p.k.",
  "Sh.a.",
  "Person Juridik",
  "Ortakeri",
  "Dega e shoqërisë së huaj",
];

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
  dateOfBirth: string; // ISO
  gender: Gender;
  nationality?: string;
  placeOfBirth?: string;

  // Company fields
  companyName?: string;
  nipt?: string;
  companyType?: CompanyType;
  registrationDate?: string;
  legalRepresentative?: string;

  // Shared
  f5Location?: string; // F5 location code
  address?: string;
  city?: string;       // company only
  country?: string;    // company only
  phone?: string;
  email?: string;
  occupation?: string;
  pepStatus: PEPStatus;
  notes?: string;
  totalExposure: number;
  createdDate: string;
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
  pepStatus: z.enum(["Unknown", "No", "Yes"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
}).superRefine((c, ctx) => {
  if (c.customerType === "Individual") {
    if (!c.firstName?.trim()) ctx.addIssue({ code: "custom", message: "First name is required", path: ["firstName"] });
    if (!c.lastName?.trim()) ctx.addIssue({ code: "custom", message: "Last name is required", path: ["lastName"] });
    if (!c.personalId?.trim()) ctx.addIssue({ code: "custom", message: "SSN / Personal ID is required", path: ["personalId"] });
    if (!c.dateOfBirth) ctx.addIssue({ code: "custom", message: "Date of birth is required", path: ["dateOfBirth"] });
  } else {
    if (!c.companyName?.trim()) ctx.addIssue({ code: "custom", message: "Company name is required", path: ["companyName"] });
    if (!c.nipt?.trim()) ctx.addIssue({ code: "custom", message: "NIPT is required", path: ["nipt"] });
  }
});

const seed: Customer[] = [
  { id: "CUS-0001", customerType: "Individual", firstName: "Arben", lastName: "Hoxha", fatherName: "Petrit", personalId: "AL-TR-J70412900A",
    dateOfBirth: "1970-04-12", gender: "Male", nationality: "Albanian", placeOfBirth: "Tirana",
    f5Location: "bb123bb123", address: "Rruga e Kavajës 88", phone: "+355 69 201 4488", email: "arben.hoxha@example.al",
    occupation: "Civil Engineer", pepStatus: "No", totalExposure: 145000, createdDate: "2025-09-14",
    notes: "Long-standing client of Tirana branch — mortgage protection holder." },
  { id: "CUS-0002", customerType: "Individual", firstName: "Elira", lastName: "Dervishi", fatherName: "Bashkim", personalId: "AL-DR-H85822015B",
    dateOfBirth: "1988-08-22", gender: "Female", nationality: "Albanian", placeOfBirth: "Durrës",
    f5Location: "dd345dd345", address: "Bulevardi Epidamn 14", phone: "+355 68 305 9912", email: "elira.dervishi@example.al",
    occupation: "Senior Government Advisor", pepStatus: "Yes", totalExposure: 95000, createdDate: "2026-01-30",
    notes: "Politically exposed person — advisor at Ministry of Finance. Compliance review required on each new policy." },
  { id: "CUS-0003", customerType: "Individual", firstName: "Dritan", lastName: "Kola", fatherName: "Sokol", personalId: "AL-VL-G65003317C",
    dateOfBirth: "1965-03-03", gender: "Male", nationality: "Albanian", placeOfBirth: "Vlorë",
    f5Location: "ee456ee456", address: "Rruga Justin Godart 5", phone: "+355 69 444 7720", email: "dritan.kola@example.al",
    occupation: "Restaurant Owner", pepStatus: "No", totalExposure: 60000, createdDate: "2024-11-08" },
  { id: "CUS-0004", customerType: "Individual", firstName: "Mira", lastName: "Leka", fatherName: "Gjergj", personalId: "AL-SH-K92517822D",
    dateOfBirth: "1992-05-17", gender: "Female", nationality: "Albanian", placeOfBirth: "Shkodër",
    f5Location: "ff567ff567", address: "Rruga 28 Nëntori 22", phone: "+355 67 818 3300", email: "mira.leka@example.al",
    occupation: "Pharmacist", pepStatus: "No", totalExposure: 0, createdDate: "2026-03-05",
    notes: "Newly onboarded — referred by Arben Hoxha." },
  { id: "CUS-0005", customerType: "Company", firstName: "", lastName: "", personalId: "",
    companyName: "Alb-Trans Logistics Sh.p.k.", nipt: "L72416502K", companyType: "Sh.p.k.",
    registrationDate: "2012-06-15", legalRepresentative: "Genc Beqiri",
    dateOfBirth: "", gender: "Other",
    f5Location: "bb123bb123", city: "Tirana", country: "Albania",
    address: "Rruga e Durrësit, Km 5", phone: "+355 4 222 7788", email: "info@albtrans.al",
    pepStatus: "No", totalExposure: 320000, createdDate: "2025-07-22",
    notes: "Group life cover for 42 employees." },
];

let customers: Customer[] = [...seed];

export const listCustomers = () => customers;
export const getCustomer = (id: string) => customers.find((c) => c.id === id);

export const upsertCustomer = (c: Customer) => {
  const i = customers.findIndex((x) => x.id === c.id);
  if (i >= 0) customers[i] = c;
  else customers = [c, ...customers];
};

export const newCustomerId = () =>
  `CUS-${String(customers.length + 1).padStart(4, "0")}`;

export const fullName = (c: Customer) =>
  c.customerType === "Company"
    ? (c.companyName ?? "—")
    : `${c.firstName} ${c.lastName}`.trim();

export const ageFromDob = (iso: string) => {
  if (!iso) return 0;
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

export const f5LocationLabel = (code?: string) =>
  F5_LOCATIONS.find((l) => l.code === code)?.label ?? code ?? "—";
