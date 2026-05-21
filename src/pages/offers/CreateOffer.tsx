import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, Plus, Trash2, Users, Package, Calendar, Calculator, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { seedProducts } from "@/data/products";
import { listVersions, getActiveVersions } from "@/data/productVersions";
import { listTemplates } from "@/data/templates";
import { listCustomers, fullName, ageFromDob, getCustomer } from "@/data/customers";
import {
  Beneficiary,
  newOfferId,
  PaymentMode,
  upsertOffer,
} from "@/data/offers";
import PremiumCalculation, { PremiumResult } from "./PremiumCalculation";
import VerificationStep, { VerificationCheck, overallStatus } from "./VerificationStep";
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

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Partner", "Bank", "Other"];

const SECTIONS = [
  { id: "product", label: "Product", icon: Package },
  { id: "people", label: "People", icon: Users },
  { id: "dates", label: "Dates", icon: Calendar },
  { id: "premium", label: "Premium", icon: Calculator },
  { id: "verification", label: "Verification", icon: ShieldCheck },
] as const;

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

  // Step 1
  const [productId, setProductId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [currency, setCurrency] = useState("");

  // Step 2
  const customers = useMemo(() => listCustomers(), []);
  const [policyHolderId, setPolicyHolderId] = useState("");
  const [payerId, setPayerId] = useState("");
  const [insuredId, setInsuredId] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

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
  const [remainingYears, setRemainingYears] = useState("");
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
      const rem = pick("remaining years", "remaining loan years", "remaining");
      const out = pick("outstanding balance", "outstanding", "balance");

      if (amt) setLoanAmount(amt);
      if (ir) setInterestRate(ir);
      if (term) setLoanTermYears(term);
      if (rem) setRemainingYears(rem);
      if (out) setOutstandingBalance(out);
      if (!hasLoan) setHasLoan(true);
      setLoanFileName(file.name);

      const filled = [amt, ir, term, rem, out].filter(Boolean).length;
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

  // Step 4 result
  const [premiumResult, setPremiumResult] = useState<PremiumResult | null>(null);

  // Step 5 result
  const [verificationChecks, setVerificationChecks] = useState<VerificationCheck[]>([]);

  // Derived
  const product = seedProducts.find((p) => p.id === productId);
  const versions = productId ? getActiveVersions(productId) : [];
  const allVersions = productId ? listVersions(productId) : [];
  const version = allVersions.find((v) => v.id === versionId);
  const templates = productId && versionId ? listTemplates(productId, versionId).filter((t) => t.isActive) : [];
  const template = templates.find((t) => t.id === templateId);
  const allowedCurrencies = template?.allowedCurrencies ?? [];

  const insured = insuredId ? getCustomer(insuredId) : undefined;
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
  const onProductChange = (id: string) => {
    setProductId(id);
    setVersionId("");
    setTemplateId("");
    setCurrency("");
  };
  const onVersionChange = (id: string) => {
    setVersionId(id);
    setTemplateId("");
    setCurrency("");
  };
  const onTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = listTemplates(productId, versionId).find((x) => x.id === id);
    setCurrency(t?.defaultCurrency ?? "");
  };

  const addBeneficiary = () => {
    setBeneficiaries((prev) => [
      ...prev,
      { id: `b-${Date.now()}`, customerId: "", relationship: "Spouse", percentage: 0 },
    ]);
  };
  const updateBeneficiary = (id: string, patch: Partial<Beneficiary>) => {
    setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const removeBeneficiary = (id: string) => {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  // Validation
  const productOk = !!(productId && versionId && templateId && currency);
  const peopleOk = !!(policyHolderId && payerId && insuredId)
    && (beneficiaries.length === 0 || (beneficiariesValid && beneficiaries.every((b) => b.customerId && b.percentage > 0)));
  const canSave = productOk && peopleOk;

  const handleSave = (intent: "Draft" | "Submit" | "Approve") => {
    if (!canSave) {
      toast.error("Complete required fields before saving");
      return;
    }
    let status: "Draft" | "Quoted" | "Pending Review" | "Approved" = "Draft";
    if (intent === "Draft") {
      status = "Draft";
    } else {
      const computed = overallStatus(verificationChecks);
      if (computed === "Pending Review") status = "Pending Review";
      else status = intent === "Approve" ? "Approved" : "Quoted";
    }

    const { id, number } = newOfferId();
    upsertOffer({
      id,
      number,
      productId,
      versionId,
      templateId,
      currency,
      policyHolderId,
      payerId,
      insuredId,
      beneficiaries,
      startDate,
      endDate,
      termYears,
      paymentMode,
      loan: hasLoan
        ? {
            amount: Number(loanAmount) || 0,
            interestRate: Number(interestRate) || 0,
            loanTermYears: Number(loanTermYears) || 0,
            remainingYears: Number(remainingYears) || 0,
            outstandingBalance: Number(outstandingBalance) || 0,
          }
        : undefined,
      premium: premiumResult?.grossPremium ?? 0,
      status,
      createdDate: new Date().toISOString().slice(0, 10),
    });
    toast.success(`Offer ${number} saved as ${status}`);
    navigate("/offers");
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/offers")} className="gap-2">
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
              <CardDescription>Pick a product, an active version, and the package to base the offer on.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Product</Label>
                <Select value={productId} onValueChange={onProductChange}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {seedProducts.filter((p) => p.status === "Active").map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product Version (Active only)</Label>
                <Select value={versionId} onValueChange={onVersionChange} disabled={!productId}>
                  <SelectTrigger><SelectValue placeholder={productId ? "Select version" : "Pick product first"} /></SelectTrigger>
                  <SelectContent>
                    {versions.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No active versions for this product.</div>
                    ) : versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} · {v.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Template / Package</Label>
                <Select value={templateId} onValueChange={onTemplateChange} disabled={!versionId}>
                  <SelectTrigger><SelectValue placeholder={versionId ? "Select package" : "Pick version first"} /></SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No active packages for this version.</div>
                    ) : templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={!templateId}>
                  <SelectTrigger><SelectValue placeholder={templateId ? "Select currency" : "Pick package first"} /></SelectTrigger>
                  <SelectContent>
                    {allowedCurrencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {template && (
                  <div className="text-[11px] text-muted-foreground mt-1.5">
                    Available: {allowedCurrencies.map((c) => (
                      <Badge key={c} variant="outline" className="mr-1 font-normal">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {template && (
                <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">{product?.name} · {version?.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{template.description}</div>
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
                <Select value={policyHolderId} onValueChange={setPolicyHolderId}>
                  <SelectTrigger><SelectValue placeholder="Select holder" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{fullName(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-7 text-xs"
                  onClick={() => navigate("/customers/new")}
                >
                  + Create new customer
                </Button>
              </div>
              <div>
                <Label>Invoice Recipient / Payer</Label>
                <Select value={payerId} onValueChange={setPayerId}>
                  <SelectTrigger><SelectValue placeholder="Select payer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{fullName(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                <Select value={insuredId} onValueChange={setInsuredId}>
                  <SelectTrigger><SelectValue placeholder="Select insured" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{fullName(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
                {policyHolderId && (
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
                      <TableHead className="w-[180px]">Relationship</TableHead>
                      <TableHead className="w-[140px]">Percentage</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                          No beneficiaries added yet.
                        </TableCell>
                      </TableRow>
                    ) : beneficiaries.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Select value={b.customerId} onValueChange={(v) => updateBeneficiary(b.id, { customerId: v })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select customer" /></SelectTrigger>
                            <SelectContent>
                              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{fullName(c)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={b.relationship} onValueChange={(v) => updateBeneficiary(b.id, { relationship: v })}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
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
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
              <CardContent className="grid gap-4 md:grid-cols-3">
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
                  <Label>Remaining Loan Years</Label>
                  <Input type="number" value={remainingYears} onChange={(e) => setRemainingYears(e.target.value)} />
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
            templateId={templateId}
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
                    remainingYears: Number(remainingYears) || 0,
                    outstandingBalance: Number(outstandingBalance) || 0,
                  }
                : undefined
            }
            onResultChange={setPremiumResult}
          />
        </section>

        <section id="verification" className="scroll-mt-32">
          <VerificationStep
            productId={productId}
            versionId={versionId}
            templateId={templateId}
            currency={currency}
            policyHolderId={policyHolderId}
            insuredId={insuredId}
            premium={premiumResult}
            loanOutstanding={hasLoan ? Number(outstandingBalance) || 0 : undefined}
            onChecksComputed={setVerificationChecks}
          />
        </section>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6 sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-3 -mx-2 px-2">
        <div className="text-xs text-muted-foreground">
          {canSave ? "Ready to save." : "Complete product, parties and beneficiaries to enable submission."}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave("Draft")}>Save as Draft</Button>
          <Button variant="outline" onClick={() => handleSave("Approve")} disabled={!canSave}>
            Approve & Save
          </Button>
          <Button onClick={() => handleSave("Submit")} disabled={!canSave} className="gap-2">
            <Check className="h-4 w-4" /> Submit Offer
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateOffer;
