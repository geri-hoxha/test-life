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
  { id: "CUS-0001", firstName: "Markus", lastName: "Weber", personalId: "DE-8821-441", dateOfBirth: "1985-04-12", gender: "Male",
    address: "Maximilianstraße 14", city: "Munich", country: "Germany", phone: "+49 170 555 0182", email: "markus.weber@example.com",
    occupation: "Architect", pepStatus: "No", totalExposure: 120000, createdDate: "2025-11-02",
    notes: "Existing client of Munich branch since 2024." },
  { id: "CUS-0002", firstName: "Sofia", lastName: "Romano", personalId: "IT-RM-9921", dateOfBirth: "1990-09-30", gender: "Female",
    address: "Via del Corso 218", city: "Rome", country: "Italy", phone: "+39 06 555 7411", email: "sofia.romano@example.com",
    occupation: "Marketing Director", pepStatus: "Unknown", totalExposure: 0, createdDate: "2026-04-01" },
  { id: "CUS-0003", firstName: "Jonas", lastName: "Lindqvist", personalId: "SE-19880214-339", dateOfBirth: "1988-02-14", gender: "Male",
    address: "Drottninggatan 60", city: "Stockholm", country: "Sweden", phone: "+46 70 555 8810", email: "jonas.l@example.com",
    occupation: "Software Engineer", pepStatus: "No", totalExposure: 38500, createdDate: "2025-06-18" },
  { id: "CUS-0004", firstName: "Helena", lastName: "Novak", personalId: "SI-NHL-7711", dateOfBirth: "1976-12-04", gender: "Female",
    address: "Slovenska cesta 9", city: "Ljubljana", country: "Slovenia", phone: "+386 41 555 220", email: "helena.novak@example.com",
    occupation: "Civil Servant", pepStatus: "Yes", totalExposure: 250000, createdDate: "2024-09-22",
    notes: "PEP status declared on application — compliance reviewed Q1 2025." },
  { id: "CUS-0005", firstName: "Tomáš", lastName: "Dvořák", personalId: "CZ-7745-018", dateOfBirth: "1969-07-21", gender: "Male",
    address: "Wenceslas Square 10", city: "Prague", country: "Czechia", phone: "+420 602 555 003", email: "tomas.d@example.com",
    occupation: "Retired", pepStatus: "No", totalExposure: 75000, createdDate: "2024-02-15" },
  { id: "CUS-0006", firstName: "Anna", lastName: "Hoxha", personalId: "AL-TR-4490", dateOfBirth: "1995-03-08", gender: "Female",
    address: "Rruga e Durrësit 145", city: "Tirana", country: "Albania", phone: "+355 69 555 7720", email: "anna.hoxha@example.com",
    occupation: "Doctor", pepStatus: "Unknown", totalExposure: 0, createdDate: "2026-04-21" },
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
