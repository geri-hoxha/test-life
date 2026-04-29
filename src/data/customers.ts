import { z } from "zod";

export type Gender = "Male" | "Female" | "Other";
export type PEPStatus = "Unknown" | "No" | "Yes";

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  personalId: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  pepStatus: PEPStatus;
  notes?: string;
  totalExposure: number; // EUR aggregate across policies
  createdDate: string;
};

export const customerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  personalId: z.string().trim().min(3, "Personal ID is required").max(40),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  occupation: z.string().trim().max(100).optional().or(z.literal("")),
  pepStatus: z.enum(["Unknown", "No", "Yes"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const seed: Customer[] = [
  { id: "CUS-0001", firstName: "Arben", lastName: "Hoxha", personalId: "AL-TR-J70412900A", dateOfBirth: "1970-04-12", gender: "Male",
    address: "Rruga e Kavajës 88", city: "Tirana", country: "Albania", phone: "+355 69 201 4488", email: "arben.hoxha@example.al",
    occupation: "Civil Engineer", pepStatus: "No", totalExposure: 145000, createdDate: "2025-09-14",
    notes: "Long-standing client of Tirana branch — mortgage protection holder." },
  { id: "CUS-0002", firstName: "Elira", lastName: "Dervishi", personalId: "AL-DR-H85822015B", dateOfBirth: "1988-08-22", gender: "Female",
    address: "Bulevardi Epidamn 14", city: "Durrës", country: "Albania", phone: "+355 68 305 9912", email: "elira.dervishi@example.al",
    occupation: "Senior Government Advisor", pepStatus: "Yes", totalExposure: 95000, createdDate: "2026-01-30",
    notes: "Politically exposed person — advisor at Ministry of Finance. Compliance review required on each new policy." },
  { id: "CUS-0003", firstName: "Dritan", lastName: "Kola", personalId: "AL-VL-G65003317C", dateOfBirth: "1965-03-03", gender: "Male",
    address: "Rruga Justin Godart 5", city: "Vlorë", country: "Albania", phone: "+355 69 444 7720", email: "dritan.kola@example.al",
    occupation: "Restaurant Owner", pepStatus: "No", totalExposure: 60000, createdDate: "2024-11-08" },
  { id: "CUS-0004", firstName: "Mira", lastName: "Leka", personalId: "AL-SH-K92517822D", dateOfBirth: "1992-05-17", gender: "Female",
    address: "Rruga 28 Nëntori 22", city: "Shkodër", country: "Albania", phone: "+355 67 818 3300", email: "mira.leka@example.al",
    occupation: "Pharmacist", pepStatus: "No", totalExposure: 0, createdDate: "2026-03-05",
    notes: "Newly onboarded — referred by Arben Hoxha." },
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

export const fullName = (c: Customer) => `${c.firstName} ${c.lastName}`;

export const ageFromDob = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};
