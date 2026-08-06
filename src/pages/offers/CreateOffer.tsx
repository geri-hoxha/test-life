import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { ArrowLeft, CalendarIcon, Check, Loader2, Plus, Trash2, Users, Package, Calendar as CalendarNavIcon, Calculator, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
// import { listVersions, getActiveVersions } from "@/data/productVersions";
import { ageFromDob } from "@/data/customers";
import {
  Beneficiary,
  PaymentMode,
} from "@/data/offers";
import { useListProducts, mapApiProduct } from "@/api/products";
import { useListProductGroups } from "@/api/product-groups";
import { useListPeople } from "@/api/people";
import { useListCompanies } from "@/api/companies";
import { mergeCustomers } from "@/api/adapters/customers";
import {
  useCreateOffer,
  useAddOfferParticipant,
  useAddOfferInsuredPerson,
  useAddOfferLoanDisbursement,
  useCalculateOfferSchedules,
} from "@/api/offers";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import CustomerForm from "@/pages/customers/CustomerForm";
import PremiumCalculation from "./PremiumCalculation";
import type { Gender as RuleGender } from "@/data/premiumRules";
import { toast } from "sonner";



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
  const createOffer = useCreateOffer();
  const addParticipant = useAddOfferParticipant();
  const addInsured = useAddOfferInsuredPerson();
  const addLoan = useAddOfferLoanDisbursement();
  const calculateSchedules = useCalculateOfferSchedules();

  // Step 1
  const [productGroupId, setProductGroupId] = useState("");
  const [productId, setProductId] = useState("");
  const [versionId, setVersionId] = useState("N/A");
  const [currency, setCurrency] = useState("");

  // Step 2
  const { data: peoplePage } = useListPeople({ pageNumber: 1, pageSize: 200 });
  const { data: companiesPage } = useListCompanies({ pageNumber: 1, pageSize: 200 });
  const { data: productGroupsPage } = useListProductGroups({ pageNumber: 1, pageSize: 200 });
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });
  const customers = useMemo(
    () => mergeCustomers(peoplePage?.items, companiesPage?.items),
    [peoplePage?.items, companiesPage?.items]
  );
  /** Insured persons API only accepts people (not companies). */
  const peopleOnly = useMemo(
    () => customers.filter((c) => c.customerType === "Individual"),
    [customers]
  );
  const productGroups = useMemo(
    () => (productGroupsPage?.items ?? []).filter((g) => g.id),
    [productGroupsPage?.items]
  );
  const products = useMemo(
    () => (productsPage?.items ?? []).map(mapApiProduct),
    [productsPage?.items]
  );
  const productsInGroup = useMemo(
    () =>
      products.filter(
        (p) =>
          p.productGroupId === productGroupId &&
          (p.status === "Active" || p.status === "Draft")
      ),
    [products, productGroupId]
  );
  const getCustomerLocal = (cid: string) => customers.find((c) => c.id === cid);
  const partyTypeOf = (customerId: string): "person" | "company" =>
    getCustomerLocal(customerId)?.customerType === "Company" ? "company" : "person";
  const [policyHolderId, setPolicyHolderId] = useState("");
  const [payerId, setPayerId] = useState("");
  const [insuredId, setInsuredId] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [loanDisburseProgress, setLoanDisburseProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Step 3
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 20);
    return d.toISOString().slice(0, 10);
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Pagesa me prim te rregullt");
  const [hasLoan, setHasLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTermYears, setLoanTermYears] = useState("");
  const [outstandingBalance, setOutstandingBalance] = useState("");
  const loanFileRef = useRef<HTMLInputElement>(null);
  const [loanFileName, setLoanFileName] = useState<string | null>(null);

  const handleLoanExcelUpload = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false });

      // Build a key→value map from two-column rows: [Field, Value]
      const map = new Map<string, string>();
      for (const r of rows) {
        if (!Array.isArray(r) || r.length < 2) continue;
        const k = String(r[0] ?? "").trim().toLowerCase();
        const v = r[1];
        if (k && v !== undefined && v !== null && v !== "") map.set(k, String(v));
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
      const term = pick("loan term", "loan term (years)", "term", "term years");
      const out = pick("outstanding balance", "outstanding", "balance");

      if (amt) setLoanAmount(amt);
      if (ir) setInterestRate(ir);
      if (term) setLoanTermYears(term);
      if (out) setOutstandingBalance(out);
      if (!hasLoan) setHasLoan(true);
      setLoanFileName(file.name);

      const filled = [amt, ir, term, out].filter(Boolean).length;
      if (filled === 0) {
        toast.error("No loan fields recognized in the file. Use a two-column sheet: Field | Value.");
      } else {
        toast.success(`Imported ${filled} loan field${filled === 1 ? "" : "s"} from ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not read Excel file");
    }
  };

  // Derived
  const productGroup = productGroups.find((g) => g.id === productGroupId);
  const product = products.find((p) => p.id === productId);
  // Product Version — hidden for now
  // const versions = productId ? getActiveVersions(productId) : [];
  // const allVersions = productId ? listVersions(productId) : [];
  // const version = allVersions.find((v) => v.id === versionId);

  const insured = insuredId ? getCustomerLocal(insuredId) : undefined;
  const insuredAge = insured ? ageFromDob(insured.dateOfBirth) : 35;
  const insuredGender: RuleGender = insured?.gender === "Female" ? "Female" : insured?.gender === "Male" ? "Male" : "Any";

  const termYears = useMemo(() => {
    if (!startDate || !endDate) return 20;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffYears = Math.round(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(1, diffYears);
  }, [startDate, endDate]);

  const beneficiaryTotal = beneficiaries.reduce((s, b) => s + (Number(b.percentage) || 0), 0);
  const beneficiariesValid = beneficiaries.length === 0 || beneficiaryTotal === 100;

  // Handlers
  const onProductGroupChange = (id: string) => {
    setProductGroupId(id);
    setProductId("");
    setVersionId("N/A");
    setCurrency("");
  };
  const onProductChange = (id: string) => {
    setProductId(id);
    setVersionId("N/A");
    const p = products.find((x) => x.id === id);
    setCurrency(p?.currencies[0] ?? "");
  };
  // Product Version — hidden for now
  // const onVersionChange = (id: string) => {
  //   setVersionId(id);
  // };

  const addBeneficiary = () => {
    setBeneficiaries((prev) => [
      ...prev,
      { id: `b-${Date.now()}`, customerId: "", relationship: "", percentage: 0 },
    ]);
  };
  const updateBeneficiary = (id: string, patch: Partial<Beneficiary>) => {
    setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const removeBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  // Validation — version not yet on API; product group + product + currency are required.
  const productOk = !!(productGroupId && productId && currency);
  const peopleOk = !!(policyHolderId && payerId && insuredId)
    && peopleOnly.some((p) => p.id === insuredId)
    && (beneficiaries.length === 0 || (beneficiariesValid && beneficiaries.every((b) => b.customerId && b.percentage > 0)));
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

      if (hasLoan) {
        const termYears = Number(loanTermYears) || 0;
        const principal =
          Number(outstandingBalance) || Number(loanAmount) || 0;
        // Loop count = Loan Term (Years)
        const disbursements = buildLoanDisbursements({
          startDate,
          loanTermYears: termYears,
          principal,
        });

        if (disbursements.length > 0) {
          setLoanDisburseProgress({ current: 0, total: disbursements.length });
          try {
            for (let i = 0; i < disbursements.length; i++) {
              const row = disbursements[i];
              setLoanDisburseProgress({ current: i + 1, total: disbursements.length });
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
      }

      toast.success(`Offer ${offerId} saved`);
      navigate(`/offers/${offerId}`);
    } catch (err) {
      setLoanDisburseProgress(null);
      toast.error(err instanceof Error ? err.message : "Failed to create offer");
    }
  };

  return (
    <AppShell>
      {loanDisburseProgress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm font-medium">Creating loan disbursements…</div>
            <div className="text-xs text-muted-foreground font-mono">
              {loanDisburseProgress.current} / {loanDisburseProgress.total}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/offers")} className="gap-2" disabled={saving}>
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
              <CardDescription>Pick a product group and a package (product) to base the offer on.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Product</Label>
                <Select value={productGroupId} onValueChange={onProductGroupChange}>
                  <SelectTrigger><SelectValue placeholder="Select product group" /></SelectTrigger>
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
                <Select value={productId} onValueChange={onProductChange} disabled={!productGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder={productGroupId ? "Select package" : "Pick product group first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productsInGroup.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No packages for this product group.</div>
                    ) : productsInGroup.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Product Version — hidden for now
              <div>
                <Label>Product Version (Active only)</Label>
                <Select value={versionId} onValueChange={onVersionChange} disabled={!productId}>
                  <SelectTrigger><SelectValue placeholder={productId ? "Select version" : "Pick package first"} /></SelectTrigger>
                  <SelectContent>
                    {versions.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No active versions for this product.</div>
                    ) : versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} · {v.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}

              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={!productId}>
                  <SelectTrigger><SelectValue placeholder={productId ? "Select currency" : "Pick package first"} /></SelectTrigger>
                  <SelectContent>
                    {(product?.currencies?.length ? product.currencies : ["EUR", "ALL", "USD"]).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {product && product.currencies.length > 0 && (
                  <div className="text-[11px] text-muted-foreground mt-1.5">
                    Available: {product.currencies.map((c) => (
                      <Badge key={c} variant="outline" className="mr-1 font-normal">{c}</Badge>
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
                    <div className="text-xs text-muted-foreground mt-0.5">{product.description}</div>
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
              <CardDescription>Define who holds the policy, who pays, who is insured, and beneficiaries.</CardDescription>
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
                  className="px-0 h-7 text-xs"
                  onClick={() => setCreateCustomerOpen(true)}
                >
                  + Create new customer
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
                {policyHolderId && (
                  <Button
                    variant="link" size="sm" className="px-0 h-7 text-xs"
                    onClick={() => setPayerId(policyHolderId)}
                  >
                    Same as policy holder
                  </Button>
                )}
              </div>
              <div>
                <Label>Insured Person</Label>
                <CustomerCombobox
                  customers={peopleOnly}
                  value={insuredId}
                  onValueChange={setInsuredId}
                  placeholder="Select insured person"
                />
                {policyHolderId && getCustomerLocal(policyHolderId)?.customerType === "Individual" && (
                  <Button
                    variant="link" size="sm" className="px-0 h-7 text-xs"
                    onClick={() => setInsuredId(policyHolderId)}
                  >
                    Same as policy holder
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Beneficiaries</CardTitle>
                  <CardDescription>Total percentage must equal 100% when one or more beneficiaries are added.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={addBeneficiary}>
                  <Plus className="h-4 w-4" /> Add Beneficiary
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="w-[140px]">Percentage</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                          No beneficiaries added yet.
                        </TableCell>
                      </TableRow>
                    ) : beneficiaries.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <CustomerCombobox
                            customers={customers}
                            value={b.customerId}
                            onValueChange={(v) => updateBeneficiary(b.id, { customerId: v })}
                            placeholder="Select customer"
                            triggerClassName="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={b.percentage}
                              onChange={(e) => updateBeneficiary(b.id, { percentage: Number(e.target.value) })}
                              className="h-9 pr-7"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeBeneficiary(b.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {beneficiaries.length > 0 && (
                <div className={`mt-3 text-sm flex items-center justify-between rounded-md px-3 py-2 ${
                  beneficiariesValid ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"
                }`}>
                  <span>{beneficiariesValid ? "Beneficiary split is valid." : "Beneficiaries must total exactly 100%."}</span>
                  <span className="font-mono font-semibold">{beneficiaryTotal}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section id="dates" className="scroll-mt-32">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Policy Dates & Payment</CardTitle>
              <CardDescription>Set the cover period and payment schedule.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(parseISO(startDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate ? parseISO(startDate) : undefined}
                      onSelect={(d) => setStartDate(d ? format(d, "yyyy-MM-dd") : "")}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(parseISO(endDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate ? parseISO(endDate) : undefined}
                      onSelect={(d) => setEndDate(d ? format(d, "yyyy-MM-dd") : "")}
                      disabled={(date) => (startDate ? date < parseISO(startDate) : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="text-[11px] text-muted-foreground mt-1">Term: {termYears} years</div>
              </div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Mortgage / Loan</CardTitle>
                  <CardDescription>
                    Optional — only required for loan-protection policies. You can also import details from an Excel file.
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
                    onClick={() => setHasLoan((v) => !v)}
                  >
                    {hasLoan ? "Remove loan details" : "Add loan details"}
                  </Button>
                </div>
              </div>
              {loanFileName && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Imported from <span className="font-medium text-foreground">{loanFileName}</span>
                </div>
              )}
            </CardHeader>
            {hasLoan && (
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Loan Amount ({currency || "—"})</Label>
                  <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
                </div>
                <div>
                  <Label>Mortgage Interest Rate (%)</Label>
                  <Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div>
                  <Label>Loan Term (Years)</Label>
                  <Input type="number" value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} />
                </div>
                <div>
                  <Label>Outstanding Balance ({currency || "—"})</Label>
                  <Input type="number" value={outstandingBalance} onChange={(e) => setOutstandingBalance(e.target.value)} />
                </div>
              </CardContent>
            )}
          </Card>
        </section>

        <section id="premium" className="scroll-mt-32">
          <PremiumCalculation
            productId={productId}
            versionId={versionId}
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
                    loanTermYears: Number(loanTermYears) || 0,
                    outstandingBalance: Number(outstandingBalance) || 0,
                  }
                : undefined
            }
          />
        </section>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6 sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-3 -mx-2 px-2">
        <div className="text-xs text-muted-foreground">
          {canSave ? "Ready to save." : "Complete product, parties and beneficiaries to enable submission."}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave("Draft")} disabled={saving}>
            {saving ? "Saving…" : "Save as Draft"}
          </Button>
          <Button variant="outline" onClick={() => handleSave("Approve")} disabled={!canSave || saving}>
            Approve & Save
          </Button>
          <Button onClick={() => handleSave("Submit")} disabled={!canSave || saving} className="gap-2">
            <Check className="h-4 w-4" /> Submit Offer
          </Button>
        </div>
      </div>

      <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Create a customer and select them as the policy holder.
            </DialogDescription>
          </DialogHeader>
          {createCustomerOpen && (
            <CustomerForm
              embedded
              onCancel={() => setCreateCustomerOpen(false)}
              onSuccess={({ id }) => {
                setCreateCustomerOpen(false);
                setPolicyHolderId(id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default CreateOffer;
