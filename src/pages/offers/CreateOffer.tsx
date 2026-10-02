import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { addMonths, format, parseISO } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { OverlayLoader } from "@/components/Loader";
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
  Plus,
  Trash2,
  Users,
  Package,
  Calendar as CalendarNavIcon,
  FileSpreadsheet,
  Landmark,
} from "lucide-react";
import { Beneficiary } from "@/data/offers";
import { useGetProduct, mapApiProduct } from "@/api/products";
import { useListProductGroups } from "@/api/product-groups";
import { useGetPerson } from "@/api/people";
import { useGetCompany } from "@/api/companies";
import { parseCustomerPartyType } from "@/api/adapters/customers";
import type { Customer, CustomerType } from "@/data/customers";
import {
  useCreateOffer,
  useAddOfferParticipant,
  useAddOfferPartnerParticipants,
  useAddOfferInsuredPerson,
  useSubmitOfferLoan,
  useRateOffer,
} from "@/api/offers";
import { useMySalesAccess } from "@/api/auth";
import type {
  DomainPoliciesRelationshipToInsured,
  OffersCreateOfferRequest,
} from "@/api/types";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import CustomerForm from "@/pages/customers/CustomerForm";
import {
  SAME_AS_INSURED,
  useRelationshipToInsuredOptions,
} from "@/hooks/useRelationshipToInsuredOptions";
import { usePolicyPlanTypeLabel } from "@/hooks/usePolicyPlanTypeOptions";
import {
  coverageTermMonths,
  formatCoverageTermMonths,
} from "@/data/policy-plan-types";
import { todayLocalIsoDate } from "@/lib/date-format";
import { getApiErrorMessage, toastApiError } from "@/lib/api-error";
import {
  BANK_LOAN_NUMBER_MAX_LENGTH,
  BANK_POLICY_SERIAL_MAX_LENGTH,
  sanitizeBankPolicySerialInput,
} from "./offer-ui";
import {
  buildYearlyLoanPeriodDates,
  inclusiveYearEnd,
  nextAdjacentStart,
} from "@/lib/loan-periods";
import { getCurrencies } from "@/config/currencies";
import { toast } from "sonner";

const SECTIONS = [
  { id: "product", label: "Product", icon: Package },
  { id: "people", label: "People", icon: Users },
  { id: "dates", label: "Coverage term", icon: CalendarNavIcon },
] as const;

type ManualLoanRow = {
  id: string;
  year: number;
  periodStart: string;
  periodEnd: string;
  remainingLoanAmount: number | "";
};

const todayIso = todayLocalIsoDate;
const DEFAULT_OFFER_TERM_YEARS = 20;

const addMonthsIso = (iso: string, months: number) =>
  format(addMonths(parseISO(iso), months), "yyyy-MM-dd");

/** Latest allowed periodEnd = periodStart + maximumCoverageTermMonths (when the product sets it). */
const maxCoverageEndDate = (
  startDate: string,
  maximumCoverageTermMonths?: number | null,
): string | null => {
  if (
    !startDate ||
    maximumCoverageTermMonths == null ||
    maximumCoverageTermMonths <= 0
  ) {
    return null;
  }
  return addMonthsIso(startDate, maximumCoverageTermMonths);
};

const defaultEndFromStart = (startDate: string) => {
  const d = parseISO(startDate);
  d.setFullYear(d.getFullYear() + DEFAULT_OFFER_TERM_YEARS);
  return format(d, "yyyy-MM-dd");
};

const newManualLoanRow = (
  overrides?: Partial<ManualLoanRow>,
): ManualLoanRow => {
  const today = todayIso();
  return {
    id: crypto.randomUUID(),
    year: 1,
    periodStart: today,
    periodEnd: inclusiveYearEnd(today),
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

/** One manual row per offer year: inclusive years, next starts the day after the previous ends. */
const buildManualLoanRowsFromOfferTerm = (
  startDate: string,
  endDate: string,
  maxCoveredYears?: number | null,
): ManualLoanRow[] => {
  if (!startDate) return [newManualLoanRow()];
  const term = cappedLoanYears(
    offerTermYears(startDate, endDate),
    maxCoveredYears,
  );
  return buildYearlyLoanPeriodDates(startDate, endDate, term).map((range) => ({
    id: crypto.randomUUID(),
    year: parseISO(range.periodStart).getFullYear(),
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    remainingLoanAmount: "",
  }));
};

/** One loan-disbursement per Loan Term year. Year and remaining balance come from the loop. */
const buildLoanDisbursements = (opts: {
  startDate: string;
  endDate?: string;
  loanTermYears: number;
  principal: number;
}) => {
  const term = Math.max(0, Math.floor(opts.loanTermYears));
  if (term === 0 || !opts.startDate) return [];

  const coverageEnd =
    opts.endDate ||
    format(addMonths(parseISO(opts.startDate), term * 12), "yyyy-MM-dd");
  const principal = Math.max(0, opts.principal);
  const ranges = buildYearlyLoanPeriodDates(opts.startDate, coverageEnd, term);

  return ranges.map((range, i) => ({
    year: parseISO(range.periodStart).getFullYear(),
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    remainingLoanAmount:
      Math.round(((principal * (term - i)) / term) * 100) / 100,
  }));
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
  const addPartnerParticipants = useAddOfferPartnerParticipants();
  const addInsured = useAddOfferInsuredPerson();
  const submitLoan = useSubmitOfferLoan();
  const rateOffer = useRateOffer();
  const relationshipOptions = useRelationshipToInsuredOptions();
  const policyPlanTypeLabel = usePolicyPlanTypeLabel();

  // Step 1 — CreateOfferRequest: productId, currency, periodStart, periodEnd
  const [productGroupId, setProductGroupId] = useState("");
  const [productId, setProductId] = useState("");
  const [currency, setCurrency] = useState("");
  const [bankPolicySerial, setBankPolicySerial] = useState("");
  const [bankLoanNumber, setBankLoanNumber] = useState("");

  // Step 2 — parties are searched on the backend as the user types, so the
  // type of each selected party is remembered to post the right partyType.
  const [partyTypes, setPartyTypes] = useState<Record<string, CustomerType>>(
    {},
  );
  const rememberPartyType = (id: string, type: CustomerType | undefined) => {
    if (!id || !type) return;
    setPartyTypes((prev) =>
      prev[id] === type ? prev : { ...prev, [id]: type },
    );
  };
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
  const { data: selectedApiProduct, isLoading: productDetailLoading } =
    useGetProduct(productId, {
      enabled: Boolean(productId),
    });
  const productGroups = useMemo(
    () => (productGroupsPage?.items ?? []).filter((g) => g.id),
    [productGroupsPage?.items],
  );
  // Products are searched on the backend by the picker; the selected one is loaded by id.
  const product = useMemo(
    () => (selectedApiProduct ? mapApiProduct(selectedApiProduct) : undefined),
    [selectedApiProduct],
  );
  const partyTypeOf = (customerId: string): "person" | "company" =>
    partyTypes[customerId] === "Company" ? "company" : "person";
  const [policyHolderId, setPolicyHolderId] = useState("");
  const [payerId, setPayerId] = useState("");
  const [payerRelationship, setPayerRelationship] = useState("");
  const [insuredId, setInsuredId] = useState("");
  const prefillApplied = useRef(false);
  /** Combobox change handler that also records the picked party's type. */
  const selectParty =
    (setId: (id: string) => void) => (id: string, customer?: Customer) => {
      rememberPartyType(id, customer?.customerType);
      setId(id);
    };

  useEffect(() => {
    if (prefillApplied.current || !prefillCustomerId) return;
    const isCompany = prefillPartyType === "company";
    const found = isCompany ? prefillCompanyQ.data : prefillPersonQ.data;
    if (!found?.id) return;

    prefillApplied.current = true;
    rememberPartyType(found.id, isCompany ? "Company" : "Individual");
    setPolicyHolderId(found.id);
    setPayerId(found.id);
    if (!isCompany) {
      setInsuredId(found.id);
    }
  }, [
    prefillCustomerId,
    prefillPartyType,
    prefillPersonQ.data,
    prefillCompanyQ.data,
  ]);

  // "The same" relationship means the invoice recipient is the insured person,
  // and picking the insured as payer implies "The same".
  useEffect(() => {
    if (payerRelationship === SAME_AS_INSURED) {
      setPayerId(insuredId);
    } else if (payerId && payerId === insuredId) {
      setPayerRelationship(SAME_AS_INSURED);
    }
  }, [payerRelationship, payerId, insuredId]);
  const payerIsInsured = payerRelationship === SAME_AS_INSURED;
  const onPayerRelationshipChange = (value: string) => {
    setPayerRelationship(value);
    // Leaving "The same" frees the payer, who can no longer be the insured.
    if (value !== SAME_AS_INSURED && payerId === insuredId) setPayerId("");
  };

  type BeneficiaryDraft = Omit<Beneficiary, "percentage"> & {
    percentage: number | "";
    /** The offer's partner is the beneficiary instead of a customer. */
    isPartner?: boolean;
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
  const [loanSubmitProgress, setLoanSubmitProgress] = useState(false);

  // Step 3
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(() => defaultEndFromStart(todayIso()));
  // Refresh on every visit so newly granted/revoked offices and agents show up without a reload.
  const { data: salesAccess } = useMySalesAccess({ refetchOnMount: "always" });
  const grantedOffices = useMemo(
    () =>
      (salesAccess?.partnerOffices ?? []).filter(
        (office) => office.partnerOfficeId && office.isActive !== false,
      ),
    [salesAccess],
  );
  const grantedAgents = useMemo(
    () =>
      (salesAccess?.agents ?? []).filter(
        (agent) => agent.agentId && agent.isActive !== false,
      ),
    [salesAccess],
  );
  const [partnerOfficeId, setPartnerOfficeId] = useState(() =>
    grantedOffices.length === 1
      ? (grantedOffices[0]?.partnerOfficeId ?? "")
      : "",
  );
  const [agentId, setAgentId] = useState(() =>
    grantedAgents.length === 1 ? (grantedAgents[0]?.agentId ?? "") : "",
  );

  useEffect(() => {
    setPartnerOfficeId((current) => {
      if (grantedOffices.length === 1)
        return grantedOffices[0]?.partnerOfficeId ?? "";
      if (grantedOffices.some((office) => office.partnerOfficeId === current))
        return current;
      return "";
    });
  }, [grantedOffices]);

  useEffect(() => {
    setAgentId((current) => {
      if (grantedAgents.length === 1) return grantedAgents[0]?.agentId ?? "";
      if (grantedAgents.some((agent) => agent.agentId === current))
        return current;
      return "";
    });
  }, [grantedAgents]);

  // Policy holder and beneficiary can each be a customer or the offer's partner,
  // which the backend resolves from the offer's partner office.
  const [holderSource, setHolderSource] = useState<"customer" | "partner">(
    "customer",
  );
  const holderIsPartner =
    holderSource === "partner" && Boolean(partnerOfficeId);
  const beneficiaryIsPartner = (b: BeneficiaryDraft) =>
    Boolean(b.isPartner && partnerOfficeId);
  const partnerName =
    grantedOffices.find((office) => office.partnerOfficeId === partnerOfficeId)
      ?.partnerName || "Partner";
  const [hasLoan, setHasLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [outstandingBalance, setOutstandingBalance] = useState("");
  const loanFileRef = useRef<HTMLInputElement>(null);
  const createdOfferIdRef = useRef<string | null>(null);
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
      const maxYears = product?.maxCoveredYears;
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
  const maxEndDate = maxCoverageEndDate(
    startDate,
    product?.maximumCoverageTermMonths,
  );
  const termWithinLimit = !maxEndDate || (!!endDate && endDate <= maxEndDate);

  useEffect(() => {
    if (!product) return;
    setCurrency((current) => {
      if (current && product.currencies.includes(current)) return current;
      return product.currencies[0] ?? current;
    });
  }, [product]);

  useEffect(() => {
    if (!startDate) return;
    const maxEnd = maxCoverageEndDate(
      startDate,
      product?.maximumCoverageTermMonths,
    );
    setEndDate((current) => {
      let next = current;
      if (!next || next < startDate) {
        next = defaultEndFromStart(startDate);
      }
      if (maxEnd && next > maxEnd) return maxEnd;
      return next;
    });
  }, [startDate, product?.id, product?.maximumCoverageTermMonths]);

  const termYears = useMemo(
    () => offerTermYears(startDate, endDate),
    [startDate, endDate],
  );

  const loanRequired = Boolean(product?.requiresLoanBalances);

  // Drop any loan input when the selected product doesn't take loan balances.
  useEffect(() => {
    if (loanRequired) return;
    setHasLoan(false);
    setManualLoans(false);
    setManualLoanRows([]);
    setLoanFileName(null);
    setLoanAmount("");
    setInterestRate("");
    setOutstandingBalance("");
  }, [loanRequired]);

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
    if (id === productId) return;
    setProductId(id);
    // Filled with the product's first currency once its details load.
    setCurrency("");
  };

  const updateBeneficiary = (id: string, patch: Partial<BeneficiaryDraft>) => {
    setBeneficiaries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  // CreateOfferRequest requires currency; productId + period dates are sent with it.
  const productOk =
    !!(productId && currency && startDate && endDate) &&
    !productDetailLoading &&
    termWithinLimit;

  const peopleStarted =
    holderIsPartner ||
    Boolean(policyHolderId || payerId || insuredId) ||
    beneficiaries.some((b) => b.customerId || beneficiaryIsPartner(b));

  const peopleOk =
    !!(payerId && insuredId && payerRelationship) &&
    payerIsInsured === (payerId === insuredId) &&
    (holderIsPartner || Boolean(policyHolderId)) &&
    beneficiariesValid &&
    beneficiaries.every(
      (b) =>
        (beneficiaryIsPartner(b) || b.customerId) && Number(b.percentage) > 0,
    );

  const canSave = productOk && (!peopleStarted || peopleOk);

  const saving =
    createOffer.isPending ||
    addParticipant.isPending ||
    addPartnerParticipants.isPending ||
    addInsured.isPending ||
    submitLoan.isPending ||
    rateOffer.isPending ||
    loanSubmitProgress;

  const handleSave = async () => {
    if (saving) return;
    if (createdOfferIdRef.current) {
      navigate(`/offers/${createdOfferIdRef.current}`);
      window.scrollTo({ top: 0, left: 0 });
      return;
    }
    if (!canSave) {
      toast.error("Complete required fields before saving");
      return;
    }

    let offerId = "";
    let insuredAttachedOnCreate = false;
    try {
      const body: OffersCreateOfferRequest = {
        productId,
        currency,
        periodStart: startDate,
        periodEnd: maxEndDate && endDate > maxEndDate ? maxEndDate : endDate,
        ...(partnerOfficeId.trim()
          ? { partnerOfficeId: partnerOfficeId.trim() }
          : {}),
        ...(agentId.trim() ? { agentId: agentId.trim() } : {}),
        ...(bankPolicySerial ? { bankPolicySerial } : {}),
        ...(bankLoanNumber.trim()
          ? { bankLoanNumber: bankLoanNumber.trim() }
          : {}),
        insuredPersonId: insuredId || null,
      };
      const created = await createOffer.mutateAsync(body);
      if (!created.id) throw new Error("Offer created without id");
      offerId = created.id;
      createdOfferIdRef.current = offerId;
      insuredAttachedOnCreate = Boolean(
        insuredId &&
        created.insuredPersons?.some((p) => p.personId === insuredId),
      );
    } catch (err) {
      toastApiError(err, "Failed to create offer");
      return;
    }

    try {
      if (peopleOk) {
        // Participants: policyHolder / invoiced / beneficiary via /participants
        // share is always 1 except beneficiaries (UI % → fraction, e.g. 50 → 0.5)
        // relationshipToInsured is only valid on role "invoiced"
        if (holderIsPartner) {
          await addPartnerParticipants.mutateAsync({
            offerId,
            body: { role: "policyHolder", isLeader: true, share: 1 },
          });
        } else {
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
        }

        await addParticipant.mutateAsync({
          offerId,
          body: {
            partyId: payerId,
            partyType: partyTypeOf(payerId),
            role: "invoiced",
            isLeader: true,
            share: 1,
            relationshipToInsured:
              payerRelationship as DomainPoliciesRelationshipToInsured,
          },
        });

        for (const b of beneficiaries) {
          const share = (Number(b.percentage) || 0) / 100;
          if (beneficiaryIsPartner(b)) {
            await addPartnerParticipants.mutateAsync({
              offerId,
              body: { role: "beneficiary", isLeader: true, share },
            });
          } else if (b.customerId) {
            await addParticipant.mutateAsync({
              offerId,
              body: {
                partyId: b.customerId,
                partyType: partyTypeOf(b.customerId),
                role: "beneficiary",
                isLeader: true,
                share,
              },
            });
          }
        }

        // Insured person is always a person (never company). It is sent on create;
        // only fall back to /insured-persons if the created offer doesn't list it.
        if (!insuredAttachedOnCreate) {
          await addInsured.mutateAsync({
            offerId,
            body: { personId: insuredId },
          });
        }
      }

      const loanRows = !loanRequired
        ? []
        : manualLoans
          ? manualLoanRows.map((r) => ({
              periodStart: r.periodStart,
              periodEnd: r.periodEnd,
              remainingLoanAmount: Number(r.remainingLoanAmount) || 0,
            }))
          : hasLoan
            ? buildLoanDisbursements({
                startDate,
                endDate,
                loanTermYears: termYears,
                principal:
                  Number(outstandingBalance) || Number(loanAmount) || 0,
              })
            : [];

      if (loanRows.length > 0) {
        setLoanSubmitProgress(true);
        try {
          await submitLoan.mutateAsync({
            offerId,
            body: {
              sourceSystem: (loanFileName ? "excel-import" : "manual").slice(
                0,
                100,
              ),
              externalReference: loanFileName
                ? loanFileName.slice(0, 200)
                : null,
              periods: loanRows.map((row, i) => ({
                sequenceNumber: i + 1,
                periodStart: row.periodStart,
                periodEnd: row.periodEnd,
                openingBalance: row.remainingLoanAmount,
                closingBalance: loanRows[i + 1]?.remainingLoanAmount ?? 0,
              })),
            },
          });
        } finally {
          setLoanSubmitProgress(false);
        }
      }

      if (peopleOk && (!loanRequired || loanRows.length > 0)) {
        try {
          await rateOffer.mutateAsync(offerId);
        } catch (rateErr) {
          toast.warning(
            getApiErrorMessage(
              rateErr,
              "Offer saved, but rating could not be completed yet.",
            ),
          );
        }
      } else if (loanRequired && loanRows.length === 0) {
        toast.warning(
          "Offer created. Submit loan balances on the offer to rate it.",
        );
      }

      toast.success(`Offer ${offerId} created`);
    } catch (err) {
      setLoanSubmitProgress(false);
      toastApiError(err, "Offer created, but follow-up steps failed.");
    }

    navigate(`/offers/${offerId}`);
    window.scrollTo({ top: 0, left: 0 });
  };

  return (
    <AppShell width="wide">
      {saving && (
        <OverlayLoader
          label={
            loanSubmitProgress
              ? "Submitting loan balances…"
              : createOffer.isPending
                ? "Creating offer…"
                : "Saving offer…"
          }
        />
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
          Create with product, currency, and coverage term. People and loan
          balances can be added here or on the offer after save.
        </p>
      </div>

      <SectionNav />

      <div className="space-y-4">
        <section id="product" className="scroll-mt-32">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Selection</CardTitle>
              <CardDescription>
                CreateOfferRequest: productId, currency, periodStart, periodEnd,
                insuredPersonId, optional partnerOfficeId, agentId,
                bankPolicySerial and bankLoanNumber.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Product group</Label>
                <Select
                  value={productGroupId || undefined}
                  onValueChange={onProductGroupChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product group" />
                  </SelectTrigger>
                  <SelectContent>
                    {productGroups.map((g) => (
                      <SelectItem key={g.id!} value={g.id!}>
                        {[g.legacyCode?.trim(), g.name || g.id]
                          .filter(Boolean)
                          .join("  ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product</Label>
                <ProductCombobox
                  productGroupId={productGroupId}
                  value={productId}
                  onValueChange={onProductChange}
                  disabled={!productGroupId}
                  placeholder={
                    productGroupId
                      ? "Select product"
                      : "Pick product group first"
                  }
                  emptyMessage="No product found in this group."
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  value={currency || undefined}
                  onValueChange={setCurrency}
                  disabled={!productId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        productId ? "Select currency" : "Pick product first"
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

              <div>
                <Label>Partner office</Label>
                <Select
                  value={partnerOfficeId || undefined}
                  onValueChange={setPartnerOfficeId}
                  disabled={grantedOffices.length <= 1}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        grantedOffices.length === 0
                          ? "No partner office assigned"
                          : "Select partner office"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {grantedOffices.map((office) => {
                      const id = office.partnerOfficeId ?? "";
                      const label = [
                        office.partnerName,
                        office.officeName || office.officeCode,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <SelectItem key={id} value={id}>
                          {label || id}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Agent</Label>
                <Select
                  value={agentId || undefined}
                  onValueChange={setAgentId}
                  disabled={grantedAgents.length <= 1}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        grantedAgents.length === 0
                          ? "No agent assigned"
                          : "Select agent"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {grantedAgents.map((agent) => {
                      const id = agent.agentId ?? "";
                      return (
                        <SelectItem key={id} value={id}>
                          {agent.displayName?.trim() || id}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-muted-foreground mt-1.5">
                  Agents assigned to your user.
                </div>
              </div>

              <div>
                <Label htmlFor="bank-policy-serial">Bank policy serial</Label>
                <Input
                  id="bank-policy-serial"
                  className="font-mono"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={BANK_POLICY_SERIAL_MAX_LENGTH}
                  value={bankPolicySerial}
                  onChange={(e) =>
                    setBankPolicySerial(
                      sanitizeBankPolicySerialInput(e.target.value),
                    )
                  }
                  placeholder="Bank policy serial"
                />
              </div>

              <div>
                <Label htmlFor="bank-loan-number">Bank loan number</Label>
                <Input
                  id="bank-loan-number"
                  className="font-mono"
                  autoComplete="off"
                  maxLength={BANK_LOAN_NUMBER_MAX_LENGTH}
                  value={bankLoanNumber}
                  onChange={(e) => setBankLoanNumber(e.target.value)}
                  placeholder="Bank loan number"
                />
              </div>

              {product && (
                <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">
                    {productGroup?.name ?? "—"} · {product.name}
                  </div>
                  {product.policyPlanType ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {policyPlanTypeLabel(product.policyPlanType)}
                      <span className="font-mono">
                        {" "}
                        ({product.policyPlanType})
                      </span>
                    </div>
                  ) : null}
                  {product.coverageText ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {product.coverageText}
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
                Start with the insured person, then who holds the policy, who
                pays, and the beneficiaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Insured Person</Label>
                {/* Insured persons API only accepts people (not companies). */}
                <CustomerCombobox
                  requireSearch
                  includeCompanies={false}
                  value={insuredId}
                  onValueChange={selectParty(setInsuredId)}
                  placeholder="Select insured person"
                />
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                  onClick={() => setCreateCustomerTarget("insured")}
                >
                  Create a new customer
                </Button>
              </div>
              <div>
                <Label>Policy Holder</Label>
                {holderIsPartner ? (
                  <>
                    <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm">
                      <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{partnerName}</span>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-7 text-xs"
                      onClick={() => setHolderSource("customer")}
                    >
                      Use a customer instead
                    </Button>
                  </>
                ) : (
                  <>
                    <CustomerCombobox
                      requireSearch
                      value={policyHolderId}
                      onValueChange={selectParty(setPolicyHolderId)}
                      placeholder="Select holder"
                    />
                    <div className="flex flex-wrap items-center gap-x-3">
                      <Button
                        variant="link"
                        size="sm"
                        className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                        onClick={() => setCreateCustomerTarget("policyHolder")}
                      >
                        Create a new customer
                      </Button>
                      {insuredId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="px-0 h-7 text-xs"
                          onClick={() => setPolicyHolderId(insuredId)}
                        >
                          Same as insured person
                        </Button>
                      )}
                      {partnerOfficeId && (
                        <Button
                          variant="link"
                          size="sm"
                          className="px-0 h-7 text-xs"
                          onClick={() => setHolderSource("partner")}
                        >
                          Use partner
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div>
                <Label>Relationship to insured</Label>
                <Select
                  value={payerRelationship || undefined}
                  onValueChange={onPayerRelationshipChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-muted-foreground mt-1.5">
                  Of the invoice recipient to the insured person.
                </div>
              </div>
              <div>
                <Label>Invoice Recipient / Payer</Label>
                <CustomerCombobox
                  requireSearch
                  value={payerId}
                  onValueChange={selectParty(setPayerId)}
                  placeholder={
                    payerIsInsured
                      ? "Select insured person first"
                      : "Select payer"
                  }
                  disabled={payerIsInsured}
                />
                {payerIsInsured ? (
                  <div className="text-[11px] text-muted-foreground mt-1.5">
                    Same as the insured person.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-3">
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-7 text-xs text-blue-400 hover:text-blue-500"
                      onClick={() => setCreateCustomerTarget("payer")}
                    >
                      Create a new customer
                    </Button>
                    {insuredId && (
                      <Button
                        variant="link"
                        size="sm"
                        className="px-0 h-7 text-xs"
                        onClick={() =>
                          onPayerRelationshipChange(SAME_AS_INSURED)
                        }
                      >
                        Same as insured person
                      </Button>
                    )}
                    {policyHolderId && !holderIsPartner && (
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
                )}
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
                      <TableHead>Beneficiary</TableHead>
                      <TableHead className="w-[140px]">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="h-24">
                          <div className="relative">
                            {beneficiaryIsPartner(b) ? (
                              <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm">
                                <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{partnerName}</span>
                              </div>
                            ) : (
                              <CustomerCombobox
                                requireSearch
                                value={b.customerId}
                                onValueChange={selectParty((id) =>
                                  updateBeneficiary(b.id, { customerId: id }),
                                )}
                                placeholder="Select customer"
                                triggerClassName="h-9"
                              />
                            )}
                            <div className="absolute left-0 top-full flex flex-wrap items-center gap-x-3">
                              {beneficiaryIsPartner(b) ? (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="px-0 h-7 text-xs"
                                  onClick={() =>
                                    updateBeneficiary(b.id, {
                                      isPartner: false,
                                    })
                                  }
                                >
                                  Use a customer instead
                                </Button>
                              ) : (
                                <>
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
                                  {partnerOfficeId && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="px-0 h-7 text-xs"
                                      onClick={() =>
                                        updateBeneficiary(b.id, {
                                          isPartner: true,
                                        })
                                      }
                                    >
                                      Use partner
                                    </Button>
                                  )}
                                </>
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
                                  percentage: raw === "" ? "" : Number(raw),
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
              {beneficiaries.length > 0 && !beneficiariesValid && (
                <div className="mt-3 text-sm flex items-center justify-between rounded-md px-3 py-2 bg-destructive/10 text-destructive">
                  <span>Ownership percentage must equal 100%.</span>
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
              <CardTitle className="text-base">Coverage term</CardTitle>
              <CardDescription>
                periodStart and periodEnd sent on create.
                {product?.maximumCoverageTermMonths != null &&
                product.maximumCoverageTermMonths > 0
                  ? ` Maximum coverage is ${product.maximumCoverageTermMonths} months${
                      product.maximumCoverageTermMonths % 12 === 0
                        ? ` (${formatCoverageTermMonths(product.maximumCoverageTermMonths)})`
                        : ""
                    }.`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Period start</Label>
                <DatePicker
                  value={startDate ? parseISO(startDate) : undefined}
                  onChange={(d) =>
                    setStartDate(d ? format(d, "yyyy-MM-dd") : "")
                  }
                />
              </div>
              <div>
                <Label>Period end</Label>
                <DatePicker
                  value={endDate ? parseISO(endDate) : undefined}
                  onChange={(d) => setEndDate(d ? format(d, "yyyy-MM-dd") : "")}
                  disabled={(date) => {
                    if (startDate && date < parseISO(startDate)) return true;
                    if (maxEndDate && date > parseISO(maxEndDate)) return true;
                    return false;
                  }}
                />
                <div
                  className={`text-[11px] mt-1 ${
                    termWithinLimit
                      ? "text-muted-foreground"
                      : "text-destructive"
                  }`}
                >
                  Term:{" "}
                  {startDate && endDate
                    ? formatCoverageTermMonths(
                        coverageTermMonths(startDate, endDate),
                      )
                    : "—"}
                  {maxEndDate
                    ? ` · Max ${product?.maximumCoverageTermMonths} months (ends ${format(parseISO(maxEndDate), "dd/MM/yyyy")})`
                    : ""}
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
                    {loanRequired
                      ? "This product requires loan balances for each coverage period. You can also import details from an Excel file."
                      : product
                        ? "This product does not use loan balances."
                        : "Select a product to add loan details."}
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
                    disabled={!loanRequired}
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Upload from Excel
                  </Button>
                  <Button
                    size="sm"
                    variant={hasLoan ? "secondary" : "outline"}
                    onClick={toggleLoanDetails}
                    disabled={!loanRequired}
                  >
                    {hasLoan ? "Remove loan details" : "Add loan details"}
                  </Button>
                  <Button
                    size="sm"
                    variant={manualLoans ? "secondary" : "outline"}
                    onClick={toggleManualLoans}
                    disabled={!loanRequired}
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
                        const nextStart = nextAdjacentStart(last.periodEnd);
                        return [
                          ...rows,
                          newManualLoanRow({
                            year: parseISO(nextStart).getFullYear(),
                            periodStart: nextStart,
                            periodEnd: inclusiveYearEnd(nextStart),
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
                      covered years is {product.maxCoveredYears}. Loan rows are
                      limited to {product.maxCoveredYears}.
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
                          Opening balance
                        </TableHead>
                        <TableHead className="h-8 w-8 px-1" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualLoanRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-12 text-center text-xs text-muted-foreground"
                          >
                            No rows yet. Set offer dates, then re-open manual
                            loans or add a row.
                          </TableCell>
                        </TableRow>
                      ) : (
                        manualLoanRows.map((row) => (
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
                                    periodEnd: d ? format(d, "yyyy-MM-dd") : "",
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Closing balance for each period is taken from the next row’s
                  opening balance (0 on the last row). Premium is calculated
                  after the offer is saved.
                </div>
              </CardContent>
            )}
          </Card>
        </section>
      </div>

      <div className="flex items-center justify-between mt-6 sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-3 -mx-2 px-2">
        <div className="text-xs text-muted-foreground">
          {canSave
            ? peopleOk
              ? "Ready to create the offer and add parties."
              : "Ready to create the offer (product, currency, coverage term)."
            : !termWithinLimit
              ? `Coverage term cannot exceed ${product?.maximumCoverageTermMonths} months for this product.`
              : peopleStarted && !peopleOk
                ? "Complete parties and beneficiaries, or clear them to create the offer first."
                : "Select product, currency, and coverage term to create the offer."}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void handleSave()}
            disabled={!canSave || saving}
            className="gap-2"
          >
            <Check className="h-4 w-4" /> Create Offer
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
              onSuccess={({ id, customerType }) => {
                const target = createCustomerTarget;
                setCreateCustomerTarget(null);
                rememberPartyType(id, customerType);
                if (target === "policyHolder") setPolicyHolderId(id);
                else if (target === "payer") setPayerId(id);
                else if (target === "insured") setInsuredId(id);
                else if (target && "beneficiaryId" in target) {
                  updateBeneficiary(target.beneficiaryId, {
                    customerId: id,
                  });
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
