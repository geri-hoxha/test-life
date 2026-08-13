import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Trash2,
  Users,
  Package,
  Calendar as CalendarNavIcon,
  Calculator,
  FileSpreadsheet,
} from "lucide-react";
import { ageFromDob } from "@/data/customers";
import { Beneficiary, PaymentMode } from "@/data/offers";
import { useListProducts, mapApiProduct } from "@/api/products";
import { useListProductGroups } from "@/api/product-groups";
import { useListPeople, useGetPerson } from "@/api/people";
import { useListCompanies, useGetCompany } from "@/api/companies";
import {
  mapCompanyToCustomer,
  mapPersonToCustomer,
  mergeCustomers,
  parseCustomerPartyType,
  toApiGender,
} from "@/api/adapters/customers";
import {
  useCreateOffer,
  useAddOfferParticipant,
  useAddOfferInsuredPerson,
  useAddOfferLoanDisbursement,
  useCalculateOfferSchedules,
  useCalculateOffersPremium,
} from "@/api/offers";
import type { OffersCalculatePremiumRequest } from "@/api/types";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import CustomerForm from "@/pages/customers/CustomerForm";
import PremiumCalculation from "./PremiumCalculation";
import type { Gender as RuleGender } from "@/data/premiumRules";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/api-error";
import { getCurrencies } from "@/config/currencies";
import { toast } from "sonner";

const fmtMoney = (v: number, ccy: string) => {
  if (!ccy || !isFinite(v)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${ccy}`;
  }
};

const PAYMENT_MODES: PaymentMode[] = [
  "Pagesa me prim te rregullt",
  "Pagese per gjithe periudhen (Upfront)",
  "Pagesa me tarife te vetme për të gjithë periudhën",
  "Pagesa me prim fiks mujor",
  "Pagesa me prim fiks vjetor",
  "Pagesa me prim te paracaktuar, kjo eshte e velfshme per sigurimin e jetes se kombinuar Protect, Sigurimi i jetes se kombinuar ISP",
];

const SECTIONS = [
  { id: "product", label: "Product", icon: Package },
  { id: "people", label: "People", icon: Users },
  { id: "dates", label: "Dates", icon: CalendarNavIcon },
  { id: "premium", label: "Premium", icon: Calculator },
] as const;

type ManualLoanRow = {
  id: string;
  year: number;
  periodStart: string;
  periodEnd: string;
  remainingLoanAmount: number | "";
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const newManualLoanRow = (overrides?: Partial<ManualLoanRow>): ManualLoanRow => {
  const today = todayIso();
  return {
    id: crypto.randomUUID(),
    year: 1,
    periodStart: today,
    periodEnd: today,
    remainingLoanAmount: "",
    ...overrides,
  };
};

/** Offer term in whole years (end − start), minimum 1. */
const offerTermYears = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 1;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffYears = Math.round(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  return Math.max(1, diffYears);
};

/** Cap loan years by product maxCoveredYears when set. */
const cappedLoanYears = (
  requestedYears: number,
  maxCoveredYears?: number | null,
) => {
  if (maxCoveredYears == null || maxCoveredYears <= 0) return requestedYears;
  return Math.min(requestedYears, Math.floor(maxCoveredYears));
};

/** One manual row per offer year: periodStart/End advance by 1 year from offer start. */
const buildManualLoanRowsFromOfferTerm = (
  startDate: string,
  endDate: string,
  maxCoveredYears?: number | null,
): ManualLoanRow[] => {
  if (!startDate) return [newManualLoanRow()];
  const start = parseISO(startDate);
  const term = cappedLoanYears(
    offerTermYears(startDate, endDate),
    maxCoveredYears,
  );
  const rows: ManualLoanRow[] = [];
  for (let i = 0; i < term; i++) {
    const periodStartDate = new Date(start);
    periodStartDate.setFullYear(start.getFullYear() + i);
    const periodEndDate = new Date(start);
    periodEndDate.setFullYear(start.getFullYear() + i + 1);
    rows.push({
      id: crypto.randomUUID(),
      year: periodStartDate.getFullYear(),
      periodStart: format(periodStartDate, "yyyy-MM-dd"),
      periodEnd: format(periodEndDate, "yyyy-MM-dd"),
      remainingLoanAmount: "",
    });
  }
  return rows;
};

/** One loan-disbursement per Loan Term year. Year and remaining balance come from the loop. */
const buildLoanDisbursements = (opts: {
  startDate: string;
  loanTermYears: number;
  principal: number;
}) => {
  const term = Math.max(0, Math.floor(opts.loanTermYears));
  if (term === 0 || !opts.startDate) return [];

  const start = parseISO(opts.startDate);
  const principal = Math.max(0, opts.principal);

  const rows: {
    year: number;
    periodStart: string;
    periodEnd: string;
    remainingLoanAmount: number;
  }[] = [];

  for (let i = 0; i < term; i++) {
    const periodStartDate = new Date(start);
    periodStartDate.setFullYear(start.getFullYear() + i);
    const periodEndDate = new Date(start);
    periodEndDate.setFullYear(start.getFullYear() + i + 1);
    // Declining balance: year 0 = full principal, last year = principal / term
    const remainingLoanAmount =
      Math.round(((principal * (term - i)) / term) * 100) / 100;

    rows.push({
      year: periodStartDate.getFullYear(),
      periodStart: format(periodStartDate, "yyyy-MM-dd"),
      periodEnd: format(periodEndDate, "yyyy-MM-dd"),
      remainingLoanAmount,
    });
  }

  return rows;
};

const SectionNav = () => (
  <div className="sticky top-16 z-20 -mx-2 mb-6 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
    <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
          >
            <Icon className="h-3.5 w-3.5" />
            {s.label}
          </a>
        );
      })}
    </div>
  </div>
);

const CreateOffer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCustomerId = searchParams.get("customerId")?.trim() ?? "";
  const prefillPartyType = parseCustomerPartyType(searchParams.get("type"));
  const createOffer = useCreateOffer();
  const addParticipant = useAddOfferParticipant();
  const addInsured = useAddOfferInsuredPerson();
  const addLoan = useAddOfferLoanDisbursement();
  const calculateSchedules = useCalculateOfferSchedules();

  // Step 1
  const [productGroupId, setProductGroupId] = useState("");
  const [productId, setProductId] = useState("");
  const [currency, setCurrency] = useState("");

  // Step 2
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({
    pageNumber: 1,
    pageSize: 200,
  });
  const prefillPersonQ = useGetPerson(prefillCustomerId, {
    enabled: Boolean(prefillCustomerId) && prefillPartyType !== "company",
  });
  const prefillCompanyQ = useGetCompany(prefillCustomerId, {
    enabled: Boolean(prefillCustomerId) && prefillPartyType === "company",
  });
  const { data: productGroupsPage } = useListProductGroups({
    pageNumber: 1,
    pageSize: 200,
  });
  const { data: productsPage } = useListProducts({
    pageNumber: 1,
    pageSize: 200,
  });
  const customers = useMemo(() => {
    const merged = mergeCustomers(peoplePage?.items, companiesPage?.items);
    const byId = new Map(merged.map((c) => [c.id, c]));
    if (prefillPartyType !== "company" && prefillPersonQ.data?.id) {
      const mapped = mapPersonToCustomer(prefillPersonQ.data);
      if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    if (prefillPartyType === "company" && prefillCompanyQ.data?.id) {
      const mapped = mapCompanyToCustomer(prefillCompanyQ.data);
      if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
    }
    return Array.from(byId.values());
  }, [
    peoplePage?.items,
    companiesPage?.items,
    prefillPartyType,
    prefillPersonQ.data,
    prefillCompanyQ.data,
  ]);
  /** Insured persons API only accepts people (not companies). */
  const peopleOnly = useMemo(
    () => customers.filter((c) => c.customerType === "Individual"),
    [customers],
  );
  const productGroups = useMemo(
    () => (productGroupsPage?.items ?? []).filter((g) => g.id),
    [productGroupsPage?.items],
  );
  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items],
  );
  const productsInGroup = useMemo(
    () =>
      products.filter(
        (p) =>
          p.productGroupId === productGroupId &&
          (p.status === "Active" || p.status === "Draft"),
      ),
    [products, productGroupId],
  );
  const getCustomerLocal = (cid: string) => customers.find((c) => c.id === cid);
  const partyTypeOf = (customerId: string): "person" | "company" =>
    getCustomerLocal(customerId)?.customerType === "Company"
      ? "company"
      : "person";
  const [policyHolderId, setPolicyHolderId] = useState("");
  const [payerId, setPayerId] = useState("");
  const [insuredId, setInsuredId] = useState("");
  const prefillApplied = useRef(false);

  useEffect(() => {
    if (prefillApplied.current || !prefillCustomerId) return;
    const customer = getCustomerLocal(prefillCustomerId);
    if (!customer) return;

    prefillApplied.current = true;
    setPolicyHolderId(customer.id);
    setPayerId(customer.id);
    if (customer.customerType === "Individual") {
      setInsuredId(customer.id);
    }
  }, [prefillCustomerId, customers]);

  type BeneficiaryDraft = Omit<Beneficiary, "percentage"> & {
    percentage: number | "";
  };
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryDraft[]>([
    {
      id: `b-${Date.now()}`,
      customerId: "",
      relationship: "",
      percentage: 100,
    },
  ]);
  type CreateCustomerTarget =
    | "policyHolder"
    | "payer"
    | "insured"
    | { beneficiaryId: string };
  const [createCustomerTarget, setCreateCustomerTarget] =
    useState<CreateCustomerTarget | null>(null);
  const [loanDisburseProgress, setLoanDisburseProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Step 3
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 20);
    return d.toISOString().slice(0, 10);
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    "Pagesa me prim te rregullt",
  );
  const [hasLoan, setHasLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [outstandingBalance, setOutstandingBalance] = useState("");
  const loanFileRef = useRef<HTMLInputElement>(null);
  const [loanFileName, setLoanFileName] = useState<string | null>(null);
  const [manualLoans, setManualLoans] = useState(false);
  const [manualLoanRows, setManualLoanRows] = useState<ManualLoanRow[]>([]);

  const updateManualLoanRow = (
    id: string,
    patch: Partial<Omit<ManualLoanRow, "id">>,
  ) => {
    setManualLoanRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const toggleLoanDetails = () => {
    setHasLoan((prev) => {
      if (prev) return false;
      setManualLoans(false);
      setManualLoanRows([]);
      return true;
    });
  };

  const toggleManualLoans = () => {
    setManualLoans((prev) => {
      if (prev) {
        setManualLoanRows([]);
        return false;
      }
      setHasLoan(false);
      const selectedProduct = products.find((p) => p.id === productId);
      const maxYears = selectedProduct?.maxCoveredYears;
      const requested = offerTermYears(startDate, endDate);
      const capped = cappedLoanYears(requested, maxYears);
      setManualLoanRows(
        buildManualLoanRowsFromOfferTerm(startDate, endDate, maxYears),
      );
      if (maxYears != null && maxYears > 0 && requested > capped) {
        toast.warning(
          `Product max covered years is ${maxYears}. Only ${capped} loan row${capped === 1 ? "" : "s"} generated.`,
        );
      }
      return true;
    });
  };

  const handleLoanExcelUpload = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, {
        header: 1,
        blankrows: false,
      });

      // Build a key→value map from two-column rows: [Field, Value]
      const map = new Map<string, string>();
      for (const r of rows) {
        if (!Array.isArray(r) || r.length < 2) continue;
        const k = String(r[0] ?? "")
          .trim()
          .toLowerCase();
        const v = r[1];
        if (k && v !== undefined && v !== null && v !== "")
          map.set(k, String(v));
      }

      const pick = (...keys: string[]) => {
        for (const k of keys) {
          const v = map.get(k.toLowerCase());
          if (v !== undefined) return v.replace(/[^0-9.\-]/g, "");
        }
        return "";
      };

      const amt = pick("loan amount", "amount", "principal");
      const ir = pick("interest rate", "mortgage interest rate", "rate");
      const out = pick("outstanding balance", "outstanding", "balance");

      if (amt) setLoanAmount(amt);
      if (ir) setInterestRate(ir);
      if (out) setOutstandingBalance(out);
      setManualLoans(false);
      setManualLoanRows([]);
      setHasLoan(true);
      setLoanFileName(file.name);

      const filled = [amt, ir, out].filter(Boolean).length;
      if (filled === 0) {
        toast.error(
          "No loan fields recognized in the file. Use a two-column sheet: Field | Value.",
        );
      } else {
        toast.success(
          `Imported ${filled} loan field${filled === 1 ? "" : "s"} from ${file.name}`,
        );
      }
    } catch {
      toast.error("Could not read Excel file");
    }
  };

  // Derived
  const productGroup = productGroups.find((g) => g.id === productGroupId);
  const product = products.find((p) => p.id === productId);

  const insured = insuredId ? getCustomerLocal(insuredId) : undefined;
  const insuredAge = insured ? ageFromDob(insured.dateOfBirth) : 35;
  const insuredGender: RuleGender =
    insured?.gender === "Female"
      ? "Female"
      : insured?.gender === "Male"
        ? "Male"
        : "Any";
  const apiGender = insured ? toApiGender(insured.gender) : undefined;

  const termYears = useMemo(
    () => offerTermYears(startDate, endDate),
    [startDate, endDate],
  );

  const manualPremiumRequest = useMemo((): OffersCalculatePremiumRequest | null => {
    if (!manualLoans || !productId || !currency) return null;
    if (!insured?.dateOfBirth || !apiGender) return null;
    if (manualLoanRows.length === 0) return null;
    return {
      productId,
      currency,
      dateOfBirth: insured.dateOfBirth,
      gender: apiGender,
      loanDisbursements: manualLoanRows.map((r) => ({
        year: Number(r.year) || 0,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        remainingLoanAmount: Number(r.remainingLoanAmount) || 0,
      })),
    };
  }, [
    manualLoans,
    productId,
    currency,
    insured?.dateOfBirth,
    apiGender,
    manualLoanRows,
  ]);

  const debouncedManualPremiumRequest = useDebouncedValue(
    manualPremiumRequest,
    500,
  );
  const {
    data: manualPremiumPreview,
    isFetching: manualPremiumLoading,
    isError: manualPremiumError,
    error: manualPremiumErr,
  } = useCalculateOffersPremium(debouncedManualPremiumRequest);

  const manualPremiumByYear = useMemo(() => {
    const map = new Map<number, { insuredAmount: number; premium: number }>();
    for (const row of manualPremiumPreview ?? []) {
      if (row.year != null) {
        map.set(row.year, {
          insuredAmount: row.insuredAmount,
          premium: row.premium,
        });
      }
    }
    return map;
  }, [manualPremiumPreview]);

  const manualPremiumTotals = useMemo(() => {
    const rows = manualPremiumPreview ?? [];
    return {
      insuredAmount: rows.reduce((sum, r) => sum + r.insuredAmount, 0),
      premium: rows.reduce((sum, r) => sum + r.premium, 0),
    };
  }, [manualPremiumPreview]);

  const premiumHint = !manualLoans
    ? null
    : !productId || !currency
      ? "Select product and currency to calculate premium."
      : !insured?.dateOfBirth || !apiGender
        ? "Select an insured person with date of birth and gender to calculate premium."
        : manualLoanRows.length === 0
          ? "Add at least one loan row to calculate premium."
          : null;

  const beneficiaryTotal = beneficiaries.reduce(
    (s, b) => s + (Number(b.percentage) || 0),
    0,
  );
  const beneficiariesValid =
    beneficiaries.length === 0 || beneficiaryTotal === 100;

  // Handlers
  const onProductGroupChange = (id: string) => {
    setProductGroupId(id);
    setProductId("");
    setCurrency("");
  };
  const onProductChange = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    setCurrency(p?.currencies[0] ?? "");
  };

  const updateBeneficiary = (id: string, patch: Partial<BeneficiaryDraft>) => {
    setBeneficiaries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  // Validation — version not yet on API; product group + product + currency are required.
  const productOk = !!(productGroupId && productId && currency);
  const peopleOk =
    !!(policyHolderId && payerId && insuredId) &&
    peopleOnly.some((p) => p.id === insuredId) &&
    beneficiariesValid &&
    beneficiaries.every((b) => b.customerId && Number(b.percentage) > 0);
  const canSave = productOk && peopleOk;
  const saving =
    createOffer.isPending ||
    addParticipant.isPending ||
    addInsured.isPending ||
    addLoan.isPending ||
    calculateSchedules.isPending ||
    loanDisburseProgress !== null;

  const handleSave = async (_intent: "Draft" | "Submit" | "Approve") => {
    if (saving) return;
    if (!canSave) {
      toast.error("Complete required fields before saving");
      return;
    }

    try {
      const created = await createOffer.mutateAsync({ productId, currency });
      const offerId = created.id;
      if (!offerId) throw new Error("Offer created without id");

      // Participants: policyHolder / invoiced / beneficiary via /participants
      // share is always 1 except beneficiaries (UI % → fraction, e.g. 50 → 0.5)
      await addParticipant.mutateAsync({
        offerId,
        body: {
          partyId: policyHolderId,
          partyType: partyTypeOf(policyHolderId),
          role: "policyHolder",
          isLeader: true,
          share: 1,
        },
      });

      await addParticipant.mutateAsync({
        offerId,
        body: {
          partyId: payerId,
          partyType: partyTypeOf(payerId),
          role: "invoiced",
          isLeader: true,
          share: 1,
        },
      });

      for (const b of beneficiaries.filter((x) => x.customerId)) {
        await addParticipant.mutateAsync({
          offerId,
          body: {
            partyId: b.customerId,
            partyType: partyTypeOf(b.customerId),
            role: "beneficiary",
            isLeader: true,
            share: (Number(b.percentage) || 0) / 100,
          },
        });
      }

      // Insured person is always a person (never company) via /insured-persons
      await addInsured.mutateAsync({
        offerId,
        body: { personId: insuredId },
      });

      const disbursements = manualLoans
        ? manualLoanRows.map((r) => ({
            year: Number(r.year) || 0,
            periodStart: r.periodStart,
            periodEnd: r.periodEnd,
            remainingLoanAmount: Number(r.remainingLoanAmount) || 0,
          }))
        : hasLoan
          ? buildLoanDisbursements({
              startDate,
              loanTermYears: termYears,
              principal:
                Number(outstandingBalance) || Number(loanAmount) || 0,
            })
          : [];

      if (disbursements.length > 0) {
        setLoanDisburseProgress({ current: 0, total: disbursements.length });
        try {
          for (let i = 0; i < disbursements.length; i++) {
            const row = disbursements[i];
            setLoanDisburseProgress({
              current: i + 1,
              total: disbursements.length,
            });
            await addLoan.mutateAsync({
              offerId,
              body: {
                year: row.year,
                periodStart: row.periodStart,
                periodEnd: row.periodEnd,
                remainingLoanAmount: row.remainingLoanAmount,
              },
            });
          }

          // Schedules only apply when the offer has a loan, after loan-disbursements.
          await calculateSchedules.mutateAsync(offerId);
        } finally {
          setLoanDisburseProgress(null);
        }
      }

      toast.success(`Offer ${offerId} saved`);
      navigate(`/offers/${offerId}`);
    } catch (err) {
      setLoanDisburseProgress(null);
      toast.error(
        err instanceof Error ? err.message : "Failed to create offer",
      );
    }
  };

  return (
    <AppShell>
      {loanDisburseProgress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm font-medium">
              Creating loan disbursements…
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {loanDisburseProgress.current} / {loanDisburseProgress.total}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/offers")}
          className="gap-2"
          disabled={saving}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Offers
        </Button>
      </div>
      <div className="mb-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          New Offer
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Offer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below — all sections are on one page.
        </p>
      </div>

      <SectionNav />

      <div className="space-y-4">
        <section id="product" className="scroll-mt-32">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Selection</CardTitle>
              <CardDescription>
                Pick a product group and a package (product) to base the offer
                on.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Product</Label>
                <Select
                  value={productGroupId}
                  onValueChange={onProductGroupChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product group" />
                  </SelectTrigger>
                  <SelectContent>
                    {productGroups.map((g) => (
                      <SelectItem key={g.id!} value={g.id!}>
                        {g.english?.trim() || g.label?.trim() || g.name || g.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template / Package</Label>
                <ProductCombobox
                  products={productsInGroup}
                  value={productId}
                  onValueChange={onProductChange}
                  disabled={!productGroupId}
                  placeholder={
                    productGroupId
                      ? "Select package"
                      : "Pick product group first"
                  }
                  emptyMessage={
                    productsInGroup.length === 0
                      ? "No packages for this product group."
                      : "No package found."
                  }
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  disabled={!productId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        productId ? "Select currency" : "Pick package first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(product?.currencies?.length
                      ? product.currencies
                      : getCurrencies()
                    ).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {product && product.currencies.length > 0 && (
                  <div className="text-[11px] text-muted-foreground mt-1.5">
                    Available:{" "}
                    {product.currencies.map((c) => (
                      <Badge
                        key={c}
                        variant="outline"
                        className="mr-1 font-normal"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {product && (
                <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">
                    {productGroup?.name ?? "—"} · {product.name}
                  </div>
                  {product.description ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {product.description}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section id="people" className="scroll-mt-32">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">People</CardTitle>
              <CardDescription>
                Define who holds the policy, who pays, who is insured, and
                beneficiaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Policy Holder</Label>
                <CustomerCombobox
                  customers={customers}
                  value={policyHolderId}
                  onValueChange={setPolicyHolderId}
                  placeholder="Select holder"
                />
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                  onClick={() => setCreateCustomerTarget("policyHolder")}
                >
                  Create a new customer
                </Button>
              </div>
              <div>
                <Label>Invoice Recipient / Payer</Label>
                <CustomerCombobox
                  customers={customers}
                  value={payerId}
                  onValueChange={setPayerId}
                  placeholder="Select payer"
                />
                <div className="flex flex-wrap items-center gap-x-3">
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                    onClick={() => setCreateCustomerTarget("payer")}
                  >
                    Create a new customer
                  </Button>
                  {policyHolderId && (
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-7 text-xs"
                      onClick={() => setPayerId(policyHolderId)}
                    >
                      Same as policy holder
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label>Insured Person</Label>
                <CustomerCombobox
                  customers={peopleOnly}
                  value={insuredId}
                  onValueChange={setInsuredId}
                  placeholder="Select insured person"
                />
                <div className="flex flex-wrap items-center gap-x-3">
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                    onClick={() => setCreateCustomerTarget("insured")}
                  >
                    Create a new customer
                  </Button>
                  {policyHolderId &&
                    getCustomerLocal(policyHolderId)?.customerType ===
                      "Individual" && (
                      <Button
                        variant="link"
                        size="sm"
                        className="px-0 h-7 text-xs"
                        onClick={() => setInsuredId(policyHolderId)}
                      >
                        Same as policy holder
                      </Button>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiary</CardTitle>
              <CardDescription>
                Each policy has one beneficiary with 100% ownership by default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="w-[140px]">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="h-24">
                          <div className="relative">
                            <CustomerCombobox
                              customers={customers}
                              value={b.customerId}
                              onValueChange={(v) =>
                                updateBeneficiary(b.id, { customerId: v })
                              }
                              placeholder="Select customer"
                              triggerClassName="h-9"
                            />
                            <div className="absolute left-0 top-full flex flex-wrap items-center gap-x-3">
                              <Button
                                variant="link"
                                size="sm"
                                className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                                onClick={() =>
                                  setCreateCustomerTarget({
                                    beneficiaryId: b.id,
                                  })
                                }
                              >
                                Create a new customer
                              </Button>
                              {policyHolderId && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="px-0 h-7 text-xs"
                                  onClick={() =>
                                    updateBeneficiary(b.id, {
                                      customerId: policyHolderId,
                                    })
                                  }
                                >
                                  Same as policy holder
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={b.percentage}
                              onChange={(e) => {
                                const raw = e.target.value;
                                updateBeneficiary(b.id, {
                                  percentage:
                                    raw === "" ? "" : Number(raw),
                                });
                              }}
                              className="h-9 pr-7"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              %
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {beneficiaries.length > 0 && (
                <div
                  className={`mt-3 text-sm flex items-center justify-between rounded-md px-3 py-2 ${
                    beneficiariesValid
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <span>
                    {beneficiariesValid
                      ? "Beneficiary ownership is valid."
                      : "Ownership percentage must equal 100%."}
                  </span>
                  <span className="font-mono font-semibold">
                    {beneficiaryTotal}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section id="dates" className="scroll-mt-32">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">
                Policy Dates & Payment
              </CardTitle>
              <CardDescription>
                Set the cover period and payment schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Start Date</Label>
                <DatePicker
                  value={startDate ? parseISO(startDate) : undefined}
                  onChange={(d) =>
                    setStartDate(d ? format(d, "yyyy-MM-dd") : "")
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <DatePicker
                  value={endDate ? parseISO(endDate) : undefined}
                  onChange={(d) => setEndDate(d ? format(d, "yyyy-MM-dd") : "")}
                  disabled={(date) =>
                    startDate ? date < parseISO(startDate) : false
                  }
                />
                <div className="text-[11px] text-muted-foreground mt-1">
                  Term: {termYears} years
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Mortgage / Loan</CardTitle>
                  <CardDescription>
                    Optional — only required for loan-protection policies. You
                    can also import details from an Excel file.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={loanFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLoanExcelUpload(f);
                      if (loanFileRef.current) loanFileRef.current.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loanFileRef.current?.click()}
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Upload from Excel
                  </Button>
                  <Button
                    size="sm"
                    variant={hasLoan ? "secondary" : "outline"}
                    onClick={toggleLoanDetails}
                  >
                    {hasLoan ? "Remove loan details" : "Add loan details"}
                  </Button>
                  <Button
                    size="sm"
                    variant={manualLoans ? "secondary" : "outline"}
                    onClick={toggleManualLoans}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {manualLoans ? "Remove manual loans" : "Add loans manually"}
                  </Button>
                </div>
              </div>
              {loanFileName && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Imported from{" "}
                  <span className="font-medium text-foreground">
                    {loanFileName}
                  </span>
                </div>
              )}
            </CardHeader>
            {hasLoan && (
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Loan Amount ({currency || "—"})</Label>
                  <Input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Mortgage Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Loan Term (Years)</Label>
                  <Input
                    type="number"
                    value={termYears}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Outstanding Balance ({currency || "—"})</Label>
                  <Input
                    type="number"
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(e.target.value)}
                  />
                </div>
              </CardContent>
            )}
            {manualLoans && (
              <CardContent className="pt-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-muted-foreground">
                    {cappedLoanYears(termYears, product?.maxCoveredYears)} yr ·
                    one row/year · edit amounts as needed
                    {product?.maxCoveredYears != null &&
                      product.maxCoveredYears > 0 &&
                      termYears > product.maxCoveredYears && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                          (capped at product max {product.maxCoveredYears} yrs)
                        </span>
                      )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => {
                      const maxYears = product?.maxCoveredYears;
                      if (
                        maxYears != null &&
                        maxYears > 0 &&
                        manualLoanRows.length >= maxYears
                      ) {
                        toast.warning(
                          `This product allows a maximum of ${maxYears} covered year${maxYears === 1 ? "" : "s"}.`,
                        );
                        return;
                      }
                      setManualLoanRows((rows) => {
                        const last = rows[rows.length - 1];
                        if (!last?.periodEnd) {
                          return [
                            ...rows,
                            newManualLoanRow({ year: rows.length + 1 }),
                          ];
                        }
                        const nextStart = parseISO(last.periodEnd);
                        const nextEnd = new Date(nextStart);
                        nextEnd.setFullYear(nextStart.getFullYear() + 1);
                        return [
                          ...rows,
                          newManualLoanRow({
                            year: nextStart.getFullYear(),
                            periodStart: format(nextStart, "yyyy-MM-dd"),
                            periodEnd: format(nextEnd, "yyyy-MM-dd"),
                          }),
                        ];
                      });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Add row
                  </Button>
                </div>
                {product?.maxCoveredYears != null &&
                  product.maxCoveredYears > 0 &&
                  termYears > product.maxCoveredYears && (
                    <div className="mb-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Offer term is {termYears} years, but this product’s max
                      covered years is {product.maxCoveredYears}. Loan rows
                      are limited to {product.maxCoveredYears}.
                    </div>
                  )}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-8 w-[96px] px-2 text-xs">
                          Year
                        </TableHead>
                        <TableHead className="h-8 px-2 text-xs">
                          Start
                        </TableHead>
                        <TableHead className="h-8 px-2 text-xs">End</TableHead>
                        <TableHead className="h-8 px-2 text-xs">
                          Remaining
                        </TableHead>
                        <TableHead className="h-8 px-2 text-xs text-right">
                          Insured Amount
                        </TableHead>
                        <TableHead className="h-8 px-2 text-xs text-right">
                          Premium
                        </TableHead>
                        <TableHead className="h-8 w-8 px-1" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualLoanRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-12 text-center text-xs text-muted-foreground"
                          >
                            No rows yet. Set offer dates, then re-open manual
                            loans or add a row.
                          </TableCell>
                        </TableRow>
                      ) : (
                        manualLoanRows.map((row, idx) => {
                          const preview =
                            manualPremiumByYear.get(row.year) ??
                            manualPremiumPreview?.[idx];
                          return (
                          <TableRow key={row.id}>
                            <TableCell className="p-1.5">
                              <Input
                                type="number"
                                min={1}
                                className="h-7 px-2 text-xs"
                                value={row.year}
                                onChange={(e) =>
                                  updateManualLoanRow(row.id, {
                                    year: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              <DatePicker
                                value={
                                  row.periodStart
                                    ? parseISO(row.periodStart)
                                    : undefined
                                }
                                onChange={(d) =>
                                  updateManualLoanRow(row.id, {
                                    periodStart: d
                                      ? format(d, "yyyy-MM-dd")
                                      : "",
                                  })
                                }
                                buttonClassName="h-7 px-2 text-xs"
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              <DatePicker
                                value={
                                  row.periodEnd
                                    ? parseISO(row.periodEnd)
                                    : undefined
                                }
                                onChange={(d) =>
                                  updateManualLoanRow(row.id, {
                                    periodEnd: d
                                      ? format(d, "yyyy-MM-dd")
                                      : "",
                                  })
                                }
                                buttonClassName="h-7 px-2 text-xs"
                              />
                            </TableCell>
                            <TableCell className="p-1.5">
                              <div className="flex">
                                <span className="inline-flex h-7 shrink-0 items-center rounded-l-md border border-r-0 border-input bg-muted px-2 text-xs text-muted-foreground">
                                  {currency || "—"}
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  className="h-7 rounded-l-none px-2 text-xs"
                                  value={row.remainingLoanAmount}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    updateManualLoanRow(row.id, {
                                      remainingLoanAmount:
                                        raw === "" ? "" : Number(raw),
                                    });
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="p-1.5 text-right font-mono text-xs tabular-nums">
                              {preview
                                ? fmtMoney(preview.insuredAmount, currency || "EUR")
                                : "—"}
                            </TableCell>
                            <TableCell className="p-1.5 text-right font-mono text-xs tabular-nums text-primary">
                              {preview
                                ? fmtMoney(preview.premium, currency || "EUR")
                                : "—"}
                            </TableCell>
                            <TableCell className="p-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  setManualLoanRows((rows) =>
                                    rows.filter((r) => r.id !== row.id),
                                  )
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {manualPremiumLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Calculating premium…
                      </span>
                    ) : premiumHint ? (
                      premiumHint
                    ) : manualPremiumError ? (
                      getApiErrorMessage(
                        manualPremiumErr,
                        "Failed to calculate premium",
                      )
                    ) : manualPremiumPreview?.length ? (
                      "Premium calculated from manual loan rows."
                    ) : null}
                  </div>
                  {manualPremiumPreview && manualPremiumPreview.length > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          Total insured:{" "}
                        </span>
                        <span className="font-mono font-medium">
                          {fmtMoney(
                            manualPremiumTotals.insuredAmount,
                            currency || "EUR",
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Total premium:{" "}
                        </span>
                        <span className="font-mono font-semibold text-primary">
                          {fmtMoney(
                            manualPremiumTotals.premium,
                            currency || "EUR",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </section>

        <section id="premium" className="scroll-mt-32">
          <PremiumCalculation
            productId={productId}
            versionId="N/A"
            templateId="N/A"
            currency={currency}
            insuredAge={insuredAge}
            insuredGender={insuredGender}
            startDate={startDate}
            termYears={termYears}
            paymentMode={paymentMode}
            loan={
              hasLoan
                ? {
                    amount: Number(loanAmount) || 0,
                    interestRate: Number(interestRate) || 0,
                    loanTermYears: termYears,
                    outstandingBalance: Number(outstandingBalance) || 0,
                  }
                : undefined
            }
            serverPreview={
              manualLoans && manualPremiumPreview && manualPremiumPreview.length > 0
                ? {
                    insuredAmount: manualPremiumTotals.insuredAmount,
                    premium: manualPremiumTotals.premium,
                    loading: manualPremiumLoading,
                  }
                : undefined
            }
          />
        </section>
      </div>

      <div className="flex items-center justify-between mt-6 sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-3 -mx-2 px-2">
        <div className="text-xs text-muted-foreground">
          {canSave
            ? "Ready to save."
            : "Complete product, parties and beneficiaries to enable submission."}
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            onClick={() => handleSave("Draft")}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save as Draft"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave("Approve")}
            disabled={!canSave || saving}
          >
            Approve & Save
          </Button> */}
          <Button
            onClick={() => handleSave("Submit")}
            disabled={!canSave || saving}
            className="gap-2"
          >
            <Check className="h-4 w-4" /> Submit Offer
          </Button>
        </div>
      </div>

      <Dialog
        open={createCustomerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCreateCustomerTarget(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Create a customer and select them for this role.
            </DialogDescription>
          </DialogHeader>
          {createCustomerTarget !== null && (
            <CustomerForm
              embedded
              onCancel={() => setCreateCustomerTarget(null)}
              onSuccess={({ id }) => {
                const target = createCustomerTarget;
                setCreateCustomerTarget(null);
                if (target === "policyHolder") setPolicyHolderId(id);
                else if (target === "payer") setPayerId(id);
                else if (target === "insured") setInsuredId(id);
                else if (target && "beneficiaryId" in target) {
                  updateBeneficiary(target.beneficiaryId, { customerId: id });
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default CreateOffer;
