export type VersionStatus = "Draft" | "Active" | "Retired";

export type ProductVersion = {
  id: string;
  productId: string;
  name: string;
  number: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: VersionStatus;
  notes?: string;
  author?: string;
};

const seed: ProductVersion[] = [
  { id: "VRS-1001", productId: "PRD-001", name: "2026 Standard Life", number: "v3.2", effectiveFrom: "2026-01-15", status: "Active", notes: "Updated premium tables and introduced critical illness rider.", author: "Erin Hoxha" },
  { id: "VRS-1002", productId: "PRD-001", name: "2025 Autumn Refresh", number: "v3.1", effectiveFrom: "2025-09-02", effectiveTo: "2026-01-14", status: "Retired", notes: "Initial 2025 release.", author: "M. Hoxha" },
  { id: "VRS-1003", productId: "PRD-001", name: "2026 Mid-Year Update", number: "v3.3", status: "Draft", notes: "Planned mid-year repricing — pending compliance review.", author: "Erin Hoxha" },
  { id: "VRS-1010", productId: "PRD-002", name: "2025 Basic Refresh", number: "v2.0", effectiveFrom: "2025-03-04", status: "Active", author: "M. Hoxha" },
  { id: "VRS-1020", productId: "PRD-003", name: "2025 WholeLife Premium", number: "v1.4", effectiveFrom: "2025-06-21", status: "Active", author: "Erin Hoxha" },
  { id: "VRS-1030", productId: "PRD-004", name: "2026 Endowment 15Y", number: "v0.9", status: "Draft", notes: "Awaiting actuary sign-off.", author: "Erin Hoxha" },
  { id: "VRS-1040", productId: "PRD-005", name: "2024 TermLife 30Y", number: "v2.1", effectiveFrom: "2024-09-14", effectiveTo: "2025-12-31", status: "Retired", author: "M. Hoxha" },
  { id: "VRS-2069", productId: "PRD-069", name: "ISP Standard 2026", number: "v1.0", effectiveFrom: "2026-01-01", status: "Active", author: "Erin Hoxha" },
  { id: "VRS-2070", productId: "PRD-070", name: "ISP Mortgage Upfront 2026", number: "v1.0", effectiveFrom: "2026-01-01", status: "Active", author: "Erin Hoxha" },
  { id: "VRS-2071", productId: "PRD-071", name: "ISP PPI Konsumatore 2026", number: "v1.0", effectiveFrom: "2026-01-01", status: "Active", author: "Erin Hoxha" },
  { id: "VRS-2072", productId: "PRD-072", name: "ISP PPI Karta Krediti 2026", number: "v1.0", effectiveFrom: "2026-01-01", status: "Active", author: "Erin Hoxha" },
  { id: "VRS-2073", productId: "PRD-073", name: "ISP PPI Overdraft 2026", number: "v1.0", effectiveFrom: "2026-01-01", status: "Active", author: "Erin Hoxha" },
  { id: "VRS-2074", productId: "PRD-074", name: "ISP On-Vita 2026", number: "v1.0", effectiveFrom: "2026-01-01", status: "Active", author: "Erin Hoxha" },
];

const versions: ProductVersion[] = [...seed];

export const listVersions = (productId: string) =>
  versions.filter((v) => v.productId === productId);
