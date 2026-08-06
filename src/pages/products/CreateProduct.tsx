import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ProductStatus,
  POLICY_TYPES, INSURANCE_AMOUNT_TYPES,
  PREMIUM_PAYMENT_TYPES, PACKET_PAYMENT_TYPES, PACKET_RENEWAL_TYPES,
  PACKET_LOAN_TYPES, LOAN_PRODUCT_TYPES, ACTUARIAL_CODES, BANK_PARTNERS,
  PAYMENT_MODELS, PaymentModel,
  listPremiumTables, addPremiumTable, PremiumTableItem,
} from "@/data/products";
import { useListProductGroups } from "@/api/product-groups";
import {
  useCreateProduct,
  addProductCoverage,
  addProductDocumentType,
} from "@/api/products";
import { useListCoverages, createCoverage } from "@/api/coverages";
import { useListRatingTables } from "@/api/rating-tables";
import { useListDocumentTypes } from "@/api/document-types";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const ALL_CURRENCIES = ["EUR", "ALL", "USD"] as const;

const FLAGS = [
  { key: "pep", label: "PEP check required", desc: "Politically Exposed Person screening before issuance." },
  { key: "highInsuredAmount", label: "High insured amount requires review", desc: "Trigger underwriter review above threshold." },
  { key: "totalExposure", label: "Total customer exposure requires review", desc: "Aggregate exposure across all policies." },
  { key: "manualUnderwriting", label: "Manual underwriting required", desc: "Always route to underwriter, skip auto-approval." },
  { key: "compliance", label: "Compliance review required", desc: "AML / regulatory compliance officer sign-off." },
] as const;

const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="mb-5">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
  </div>
);

type DraftTariff = {
  name: string; legacyTariffId: string; tariffType: string; currency: string;
  effectiveFrom: string; effectiveTo: string; isActive: boolean;
  minPremium: string; maxPremium: string;
  fixedPremium: string; fixedMonthlyPremium: string; fixedAnnualPremium: string;
  formula: string; notes: string;
};
const blankTariff = (currency = "EUR"): DraftTariff => ({
  name: "", legacyTariffId: "0", tariffType: "Standard", currency,
  effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "2030-12-31", isActive: true,
  minPremium: "0", maxPremium: "0",
  fixedPremium: "0", fixedMonthlyPremium: "0", fixedAnnualPremium: "0",
  formula: "premium = coefficient × sum_insured", notes: "",
});

type DraftCoverage = {
  source: "new" | "existing";
  coverageId: string;
  name: string;
  description: string;
  legacyCoverageId: string;
  ratingTableId: string;
  ratingTableMultiplier: string;
  isMandatory: boolean;
};
const blankCoverage = (overrides?: Partial<DraftCoverage>): DraftCoverage => ({
  source: "new",
  coverageId: "",
  name: "",
  description: "",
  legacyCoverageId: "0",
  ratingTableId: "",
  ratingTableMultiplier: "1",
  isMandatory: true,
  ...overrides,
});

type DraftDocRequirement = {
  documentTypeId: string;
  name: string;
  alwaysRequired: boolean;
  insuredAmountOver: string;
  totalExposureOver: string;
  ageOver: string;
  isPep: boolean;
};
const blankDocRequirement = (overrides?: Partial<DraftDocRequirement>): DraftDocRequirement => ({
  documentTypeId: "",
  name: "",
  alwaysRequired: true,
  insuredAmountOver: "1",
  totalExposureOver: "1",
  ageOver: "0",
  isPep: true,
  ...overrides,
});

const CreateProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetGroupId = searchParams.get("groupId") ?? "";

  const { data: groupsPage } = useListProductGroups({ pageNumber: 1, pageSize: 100 });
  const { data: coveragesPage, isLoading: coveragesLoading } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: ratingTablesPage } = useListRatingTables({ pageNumber: 1, pageSize: 200 });
  const { data: documentTypesPage, isLoading: documentTypesLoading } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const createProduct = useCreateProduct();
  const apiGroups = groupsPage?.items ?? [];
  const coverageCatalog = coveragesPage?.items ?? [];
  const ratingTables = ratingTablesPage?.items ?? [];
  const documentTypeCatalog = documentTypesPage?.items ?? [];
  const [saving, setSaving] = useState(false);

  // Basic
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const type = "Life Insurance";
  const [status, setStatus] = useState<ProductStatus>("Draft");
  const [productGroup, setProductGroup] = useState<string>(presetGroupId);
  const [currencies, setCurrencies] = useState<string[]>(["EUR"]);
  const [agentCommissionPct, setAgentCommissionPct] = useState("0");
  const [bankCommissionPct, setBankCommissionPct] = useState("0");

  useEffect(() => {
    if (presetGroupId) setProductGroup(presetGroupId);
  }, [presetGroupId]);

  useEffect(() => {
    if (!productGroup && apiGroups[0]?.id) setProductGroup(apiGroups[0].id);
  }, [apiGroups, productGroup]);

  // Premium table
  const [tables, setTables] = useState(() => listPremiumTables());
  const [premiumTableId, setPremiumTableId] = useState<string>(tables[0]?.id ?? "");
  const [showNewTable, setShowNewTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableLegacy, setNewTableLegacy] = useState("0");
  const [newTableItems, setNewTableItems] = useState<PremiumTableItem[]>([
    { id: "r1", gender: "Any", minAge: 18, maxAge: 35, coefficient: 0.0012 },
    { id: "r2", gender: "Any", minAge: 36, maxAge: 55, coefficient: 0.0024 },
    { id: "r3", gender: "Any", minAge: 56, maxAge: 75, coefficient: 0.0048 },
  ]);

  const updateItem = (id: string, patch: Partial<PremiumTableItem>) =>
    setNewTableItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addItem = () =>
    setNewTableItems((rows) => [...rows, { id: `r${Date.now()}`, gender: "Any", minAge: 0, maxAge: 0, coefficient: 0 }]);
  const removeItem = (id: string) =>
    setNewTableItems((rows) => rows.filter((r) => r.id !== id));

  const createTable = () => {
    const v = newTableName.trim();
    if (!v) return;
    const t = addPremiumTable(v, parseInt(newTableLegacy, 10) || undefined, newTableItems);
    setTables(listPremiumTables());
    setPremiumTableId(t.id);
    setNewTableName(""); setNewTableLegacy("0");
    setShowNewTable(false);
    toast.success(`Premium table "${t.name}" created with ${t.items.length} rows`);
  };

  // Setup
  const [legacyPacketId, setLegacyPacketId] = useState("0");
  const [bankPartnerCode, setBankPartnerCode] = useState<string>("BKT");
  const [policyType, setPolicyType] = useState<string>("WithTable");
  const [insuranceAmountType, setInsuranceAmountType] = useState<string>("TotalAmount");
  const [legacyTariffId, setLegacyTariffId] = useState("0");
  const [maxTenorMonths, setMaxTenorMonths] = useState("240");
  const [isObsolete, setIsObsolete] = useState(false);
  const [apiSubject, setApiSubject] = useState(false);
  const [apiStraight, setApiStraight] = useState(false);

  // Payment
  const [paymentModel, setPaymentModel] = useState<PaymentModel>("StandardWithScheduleTable");
  const [premiumPaymentType, setPremiumPaymentType] = useState<string>("CurrentInsuranceYearPremium");
  const [packetPaymentType, setPacketPaymentType] = useState<string>("RegularPremiumPayment");
  const [renewalType, setRenewalType] = useState<string>("AccordingToTable");

  // Loan
  const [packetLoanType, setPacketLoanType] = useState<string>("NotApplicable");
  const [loanProductType, setLoanProductType] = useState<string>("NotApplicable");

  // Apply payment model defaults (allow override afterwards)
  const applyPaymentModel = (m: PaymentModel) => {
    setPaymentModel(m);
    const d = PAYMENT_MODELS.find((x) => x.value === m)?.defaults;
    if (!d) return;
    setPolicyType(d.policyType);
    setInsuranceAmountType(d.insuranceAmountType);
    setPremiumPaymentType(d.premiumPaymentType);
    setPacketPaymentType(d.packetPaymentType);
    setRenewalType(d.renewalType);
    setPacketLoanType(d.packetLoanType);
    setLoanProductType(d.loanProductType);
  };

  // Internal
  const [coveragePrintableText, setCoveragePrintableText] = useState("");
  const [packetFinType, setPacketFinType] = useState("");

  // External
  const [sapProductCode, setSapProductCode] = useState("");
  const [sapChannelCode, setSapChannelCode] = useState("");
  const [f5ProductCode, setF5ProductCode] = useState("");
  const [actuarialProductCode, setActuarialProductCode] = useState<string>("RegularTerm");

  // Tariffs (multiple per product)
  const [tariffs, setTariffs] = useState<DraftTariff[]>([blankTariff()]);
  const setTariffField = (idx: number, patch: Partial<DraftTariff>) =>
    setTariffs((ts) => ts.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  // Coverages (multiple per product) — posted after product create
  const [coverages, setCoverages] = useState<DraftCoverage[]>([]);
  const setCovField = (idx: number, patch: Partial<DraftCoverage>) =>
    setCoverages((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const selectedExistingIds = new Set(
    coverages.filter((c) => c.source === "existing" && c.coverageId).map((c) => c.coverageId)
  );
  const newCoverages = coverages
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => c.source === "new");

  const toggleCatalogCoverage = (cov: (typeof coverageCatalog)[number], checked: boolean) => {
    const id = cov.id ?? "";
    if (!id) return;
    if (checked) {
      setCoverages((cs) => [
        ...cs,
        blankCoverage({
          source: "existing",
          coverageId: id,
          name: cov.name?.trim() || "",
          description: cov.description ?? "",
        }),
      ]);
    } else {
      setCoverages((cs) => cs.filter((c) => !(c.source === "existing" && c.coverageId === id)));
    }
  };

  // Required documents — posted after product create via /products/{id}/document-types
  const [docRequirements, setDocRequirements] = useState<DraftDocRequirement[]>([]);
  const setDocReqField = (idx: number, patch: Partial<DraftDocRequirement>) =>
    setDocRequirements((ds) => ds.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  const selectedDocTypeIds = new Set(docRequirements.map((d) => d.documentTypeId).filter(Boolean));

  const toggleDocumentType = (docType: (typeof documentTypeCatalog)[number], checked: boolean) => {
    const id = docType.id ?? "";
    if (!id) return;
    if (checked) {
      setDocRequirements((ds) => [
        ...ds,
        blankDocRequirement({
          documentTypeId: id,
          name: docType.name?.trim() || id,
        }),
      ]);
    } else {
      setDocRequirements((ds) => ds.filter((d) => d.documentTypeId !== id));
    }
  };

  const [flags, setFlags] = useState({
    pep: false, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: false,
  });

  const toggleCurrency = (c: string) =>
    setCurrencies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    if (!productGroup) { toast.error("Product family is required"); return; }
    if (currencies.length === 0) { toast.error("Select at least one currency"); return; }

    const coverageDrafts = coverages.filter((c) =>
      c.source === "existing" ? Boolean(c.coverageId) : Boolean(c.name.trim())
    );
    for (const c of coverageDrafts) {
      if (!c.ratingTableId) {
        toast.error(`Coverage "${c.name || c.coverageId}" needs a rating table`);
        return;
      }
    }

    setSaving(true);
    try {
      const created = await createProduct.mutateAsync({
        name: name.trim(),
        productGroupId: productGroup,
        supportedCurrencies: currencies,
        coverageText: coveragePrintableText.trim() || description.trim() || undefined,
      });
      if (!created.id) throw new Error("Product created without id");

      for (const c of coverageDrafts) {
        let coverageId = c.source === "existing" ? c.coverageId : undefined;
        if (!coverageId) {
          const cov = await createCoverage({
            name: c.name.trim(),
            description: c.description.trim() || undefined,
          });
          if (!cov.id) throw new Error(`Coverage "${c.name}" created without id`);
          coverageId = cov.id;
        }
        await addProductCoverage(created.id, {
          coverageId,
          ratingTableId: c.ratingTableId,
          ratingTableMultiplier: parseFloat(c.ratingTableMultiplier) || 1,
          isMandatory: c.isMandatory,
        });
      }

      for (const d of docRequirements) {
        if (!d.documentTypeId) continue;
        await addProductDocumentType(created.id, {
          documentTypeId: d.documentTypeId,
          alwaysRequired: d.alwaysRequired,
          insuredAmountOver: d.insuredAmountOver === "" ? null : Number(d.insuredAmountOver),
          totalExposureOver: d.totalExposureOver === "" ? null : Number(d.totalExposureOver),
          ageOver: d.ageOver === "" ? 0 : Number(d.ageOver),
          isPep: d.isPep,
        });
      }

      toast.success(`Product ${created.name ?? name} created`);
      navigate(`/products/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Create" }]}
        title="Create Product"
        description="Define a new life-insurance product with grouped configuration."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/products">Cancel</Link></Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || createProduct.isPending}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {saving || createProduct.isPending ? "Saving…" : "Save Product"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Basic information" desc="Identity and ownership of the product." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ISP A_Mortgage Standard 07" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Product code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coming soon from API" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Product family *</Label>
                <Select value={productGroup} onValueChange={setProductGroup}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {apiGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id ?? ""}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{g.code?.trim() || "—"}</span>
                        {g.english?.trim() || g.name || "—"}
                        {g.label?.trim() && g.label !== g.name ? ` — ${g.label}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Agent commission (%)</Label>
                <Input type="number" min="0" max="100" step="0.01" value={agentCommissionPct}
                  onChange={(e) => setAgentCommissionPct(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Bank commission (%)</Label>
                <Input type="number" min="0" max="100" step="0.01" value={bankCommissionPct}
                  onChange={(e) => setBankCommissionPct(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Setup details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Setup details" desc="Legacy packet & insurance configuration." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Legacy packet ID</Label>
                <Input type="number" value={legacyPacketId} onChange={(e) => setLegacyPacketId(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Bank partner</Label>
                <Select value={bankPartnerCode} onValueChange={setBankPartnerCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BANK_PARTNERS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Policy type</Label>
                <Select value={policyType} onValueChange={setPolicyType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POLICY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Insurance amount type</Label>
                <Select value={insuranceAmountType} onValueChange={setInsuranceAmountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INSURANCE_AMOUNT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Legacy tariff ID</Label>
                <Input type="number" value={legacyTariffId} onChange={(e) => setLegacyTariffId(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Max tenor (months)</Label>
                <Input type="number" value={maxTenorMonths} onChange={(e) => setMaxTenorMonths(e.target.value)} className="font-mono" />
              </div>
              <div className="md:col-span-2 grid grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:border-accent/40">
                  <Checkbox checked={isObsolete} onCheckedChange={(v) => setIsObsolete(!!v)} />
                  <span className="text-sm">Obsolete</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:border-accent/40">
                  <Checkbox checked={apiSubject} onCheckedChange={(v) => setApiSubject(!!v)} />
                  <span className="text-sm">API subject</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer hover:border-accent/40">
                  <Checkbox checked={apiStraight} onCheckedChange={(v) => setApiStraight(!!v)} />
                  <span className="text-sm">API straight</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Payment details + behavior model */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Payment details"
              desc="Pick a payment behavior model. Recommended defaults are applied — you can override any field." />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Payment behavior model</Label>
                <Select value={paymentModel} onValueChange={(v) => applyPaymentModel(v as PaymentModel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Premium payment type</Label>
                  <Select value={premiumPaymentType} onValueChange={setPremiumPaymentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PREMIUM_PAYMENT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Packet payment type</Label>
                  <Select value={packetPaymentType} onValueChange={setPacketPaymentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PACKET_PAYMENT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Renewal type</Label>
                  <Select value={renewalType} onValueChange={setRenewalType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PACKET_RENEWAL_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Loan details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Loan details" desc="Loan-related configuration for bancassurance." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Packet loan type</Label>
                <Select value={packetLoanType} onValueChange={setPacketLoanType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PACKET_LOAN_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Loan product type</Label>
                <Select value={loanProductType} onValueChange={setLoanProductType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOAN_PRODUCT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Premium table */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Premium table" desc="Mortality / coefficient table used to calculate premiums." />
            <div className="flex gap-2 items-end">
              <div className="space-y-1.5 flex-1">
                <Label>Table</Label>
                <Select value={premiumTableId} onValueChange={setPremiumTableId}>
                  <SelectTrigger><SelectValue placeholder="Select table…" /></SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{t.id}</span>{t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showNewTable} onOpenChange={setShowNewTable}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="gap-1.5">
                    <Plus className="h-4 w-4" /> Create new premium table
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>New premium table</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g. Mortality Table 2026" autoFocus />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Legacy ID</Label>
                      <Input type="number" value={newTableLegacy} onChange={(e) => setNewTableLegacy(e.target.value)} className="font-mono" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add row</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gender</TableHead><TableHead>Min age</TableHead>
                          <TableHead>Max age</TableHead><TableHead>Coefficient</TableHead><TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newTableItems.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell>
                              <Select value={it.gender} onValueChange={(v) => updateItem(it.id, { gender: v as any })}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Any">Any</SelectItem>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Input type="number" className="h-8 font-mono w-20" value={it.minAge}
                              onChange={(e) => updateItem(it.id, { minAge: parseInt(e.target.value) || 0 })} /></TableCell>
                            <TableCell><Input type="number" className="h-8 font-mono w-20" value={it.maxAge}
                              onChange={(e) => updateItem(it.id, { maxAge: parseInt(e.target.value) || 0 })} /></TableCell>
                            <TableCell><Input type="number" step="0.0001" className="h-8 font-mono w-28" value={it.coefficient}
                              onChange={(e) => updateItem(it.id, { coefficient: parseFloat(e.target.value) || 0 })} /></TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(it.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTable(false)}>Cancel</Button>
                    <Button onClick={createTable} className="bg-accent text-accent-foreground hover:bg-accent/90">Create table</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Tariffs */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-start justify-between mb-4 gap-3">
              <SectionTitle title="Tariff configuration" desc="One or more tariff/rating rules for this product." />
              <Button type="button" variant="outline" size="sm" onClick={() => setTariffs((ts) => [...ts, blankTariff(currencies[0] ?? "EUR")])} className="gap-1">
                <Plus className="h-4 w-4" /> Add tariff
              </Button>
            </div>
            <div className="space-y-4">
              {tariffs.map((t, idx) => (
                <div key={idx} className="border border-border rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Tariff #{idx + 1}</div>
                    {tariffs.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setTariffs((ts) => ts.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label>Name</Label>
                      <Input value={t.name} onChange={(e) => setTariffField(idx, { name: e.target.value })} placeholder="e.g. ISP Mortgage EUR" /></div>
                    <div className="space-y-1.5"><Label>Legacy tariff ID</Label>
                      <Input type="number" className="font-mono" value={t.legacyTariffId}
                        onChange={(e) => setTariffField(idx, { legacyTariffId: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Tariff type</Label>
                      <Input value={t.tariffType} onChange={(e) => setTariffField(idx, { tariffType: e.target.value })} placeholder="Standard" /></div>
                    <div className="space-y-1.5"><Label>Currency</Label>
                      <Select value={t.currency} onValueChange={(v) => setTariffField(idx, { currency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ALL_CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1.5"><Label>Effective from</Label>
                      <Input type="date" value={t.effectiveFrom} onChange={(e) => setTariffField(idx, { effectiveFrom: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Effective to</Label>
                      <Input type="date" value={t.effectiveTo} onChange={(e) => setTariffField(idx, { effectiveTo: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Min premium</Label>
                      <Input type="number" className="font-mono" value={t.minPremium} onChange={(e) => setTariffField(idx, { minPremium: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Max premium</Label>
                      <Input type="number" className="font-mono" value={t.maxPremium} onChange={(e) => setTariffField(idx, { maxPremium: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Fixed premium</Label>
                      <Input type="number" className="font-mono" value={t.fixedPremium} onChange={(e) => setTariffField(idx, { fixedPremium: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Fixed monthly premium</Label>
                      <Input type="number" className="font-mono" value={t.fixedMonthlyPremium} onChange={(e) => setTariffField(idx, { fixedMonthlyPremium: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Fixed annual premium</Label>
                      <Input type="number" className="font-mono" value={t.fixedAnnualPremium} onChange={(e) => setTariffField(idx, { fixedAnnualPremium: e.target.value })} /></div>
                    <div className="space-y-1.5 flex items-end">
                      <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer w-full">
                        <Checkbox checked={t.isActive} onCheckedChange={(v) => setTariffField(idx, { isActive: !!v })} />
                        <span className="text-sm">Active</span>
                      </label>
                    </div>
                    <div className="space-y-1.5 md:col-span-3"><Label>Formula / calculation method</Label>
                      <Input value={t.formula} onChange={(e) => setTariffField(idx, { formula: e.target.value })} className="font-mono text-xs" /></div>
                    <div className="space-y-1.5 md:col-span-3"><Label>Notes</Label>
                      <Textarea rows={2} value={t.notes} onChange={(e) => setTariffField(idx, { notes: e.target.value })} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Coverages — linked after product create via /products/{id}/coverages */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-start justify-between mb-4 gap-3">
              <SectionTitle
                title="Coverages"
                desc="Select coverages from the catalog and assign a rating table. Saved after the product is created."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCoverages((cs) => [...cs, blankCoverage()])}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Create new
              </Button>
            </div>

            <div className="space-y-4">
              <div className="rounded-md border border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground">All coverages</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedExistingIds.size} selected
                  </Badge>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {coveragesLoading && (
                    <p className="text-xs text-muted-foreground p-3">Loading coverages…</p>
                  )}
                  {!coveragesLoading && coverageCatalog.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">
                      No coverages in the catalog yet. Use Create new, or add them later on the product detail page.
                    </p>
                  )}
                  {coverageCatalog.map((cov) => {
                    const id = cov.id ?? "";
                    const selected = selectedExistingIds.has(id);
                    const draftIdx = coverages.findIndex(
                      (c) => c.source === "existing" && c.coverageId === id
                    );
                    const draft = draftIdx >= 0 ? coverages[draftIdx] : null;
                    return (
                      <div key={id || cov.name} className="p-3 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            className="mt-0.5"
                            checked={selected}
                            onCheckedChange={(v) => toggleCatalogCoverage(cov, !!v)}
                            disabled={!id}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{cov.name ?? id}</div>
                            {cov.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cov.description}</p>
                            )}
                          </div>
                        </label>
                        {selected && draft && draftIdx >= 0 && (
                          <div className="ml-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label>Rating table *</Label>
                              <Select
                                value={draft.ratingTableId || undefined}
                                onValueChange={(v) => setCovField(draftIdx, { ratingTableId: v })}
                              >
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                  {ratingTables.map((t) => (
                                    <SelectItem key={t.id} value={t.id ?? ""}>{t.name ?? t.id}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Multiplier</Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="font-mono"
                                value={draft.ratingTableMultiplier}
                                onChange={(e) => setCovField(draftIdx, { ratingTableMultiplier: e.target.value })}
                              />
                            </div>
                            <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer self-end">
                              <Checkbox
                                checked={draft.isMandatory}
                                onCheckedChange={(v) => setCovField(draftIdx, { isMandatory: !!v })}
                              />
                              <span className="text-sm">Mandatory</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {newCoverages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">New coverages to create</p>
                  {newCoverages.map(({ c, idx }) => (
                    <div key={idx} className="border border-border rounded-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1.5">
                        <Label>Name *</Label>
                        <Input
                          value={c.name}
                          onChange={(e) => setCovField(idx, { name: e.target.value })}
                          placeholder="Death, Disability…"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={c.description}
                          onChange={(e) => setCovField(idx, { description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Rating table *</Label>
                        <Select
                          value={c.ratingTableId || undefined}
                          onValueChange={(v) => setCovField(idx, { ratingTableId: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            {ratingTables.map((t) => (
                              <SelectItem key={t.id} value={t.id ?? ""}>{t.name ?? t.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Multiplier</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="font-mono"
                          value={c.ratingTableMultiplier}
                          onChange={(e) => setCovField(idx, { ratingTableMultiplier: e.target.value })}
                        />
                      </div>
                      <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer md:col-span-2">
                        <Checkbox
                          checked={c.isMandatory}
                          onCheckedChange={(v) => setCovField(idx, { isMandatory: !!v })}
                        />
                        <span className="text-sm">Mandatory</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-self-end"
                        onClick={() => setCoverages((cs) => cs.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Required documents — linked after product create via /products/{id}/document-types */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle
              title="Required documents"
              desc="Select document types to require. Saved after the product is created."
            />
            <div className="rounded-md border border-border">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">All document types</p>
                <Badge variant="secondary" className="text-[10px]">
                  {selectedDocTypeIds.size} selected
                </Badge>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {documentTypesLoading && (
                  <p className="text-xs text-muted-foreground p-3">Loading document types…</p>
                )}
                {!documentTypesLoading && documentTypeCatalog.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3">
                    No document types in the catalog yet. Add them later on the product detail page.
                  </p>
                )}
                {documentTypeCatalog.map((docType) => {
                  const id = docType.id ?? "";
                  const selected = selectedDocTypeIds.has(id);
                  const draftIdx = docRequirements.findIndex((d) => d.documentTypeId === id);
                  const draft = draftIdx >= 0 ? docRequirements[draftIdx] : null;
                  return (
                    <div key={id || docType.name} className="p-3 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          className="mt-0.5"
                          checked={selected}
                          onCheckedChange={(v) => toggleDocumentType(docType, !!v)}
                          disabled={!id}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{docType.name ?? id}</div>
                          {docType.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{docType.description}</p>
                          )}
                        </div>
                      </label>
                      {selected && draft && draftIdx >= 0 && (
                        <div className="ml-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label>Insured amount over</Label>
                            <Input
                              type="number"
                              className="font-mono"
                              value={draft.insuredAmountOver}
                              onChange={(e) => setDocReqField(draftIdx, { insuredAmountOver: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Total exposure over</Label>
                            <Input
                              type="number"
                              className="font-mono"
                              value={draft.totalExposureOver}
                              onChange={(e) => setDocReqField(draftIdx, { totalExposureOver: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Age over</Label>
                            <Input
                              type="number"
                              className="font-mono"
                              value={draft.ageOver}
                              onChange={(e) => setDocReqField(draftIdx, { ageOver: e.target.value })}
                            />
                          </div>
                          <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer">
                            <Checkbox
                              checked={draft.alwaysRequired}
                              onCheckedChange={(v) => setDocReqField(draftIdx, { alwaysRequired: !!v })}
                            />
                            <span className="text-sm">Always required</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer">
                            <Checkbox
                              checked={draft.isPep}
                              onCheckedChange={(v) => setDocReqField(draftIdx, { isPep: !!v })}
                            />
                            <span className="text-sm">PEP</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Internal details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Internal details" desc="ESIG Life internal configuration not exposed externally." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Coverage printable text</Label>
                <Textarea rows={2} value={coveragePrintableText} onChange={(e) => setCoveragePrintableText(e.target.value)} placeholder="Sent as coverageText on create" />
              </div>
              <div className="space-y-1.5">
                <Label>Packet fin type (legacy)</Label>
                <Input type="number" value={packetFinType} onChange={(e) => setPacketFinType(e.target.value)} className="font-mono" placeholder="optional" />
              </div>
            </div>
          </Card>

          {/* External details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="External details" desc="Integration identifiers used by SAP, F5 and actuarial systems." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>SAP product code</Label>
                <Input value={sapProductCode} onChange={(e) => setSapProductCode(e.target.value)} className="font-mono" /></div>
              <div className="space-y-1.5"><Label>SAP channel code</Label>
                <Input value={sapChannelCode} onChange={(e) => setSapChannelCode(e.target.value)} className="font-mono" /></div>
              <div className="space-y-1.5"><Label>F5 product code</Label>
                <Input value={f5ProductCode} onChange={(e) => setF5ProductCode(e.target.value)} className="font-mono" /></div>
              <div className="space-y-1.5"><Label>Actuarial product code</Label>
                <Select value={actuarialProductCode} onValueChange={setActuarialProductCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTUARIAL_CODES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Available currencies" desc="Currencies in which premiums and benefits can be quoted." />
            <div className="flex flex-wrap gap-2">
              {ALL_CURRENCIES.map((c) => {
                const active = currencies.includes(c);
                return (
                  <button type="button" key={c} onClick={() => toggleCurrency(c)}
                    className={`px-4 py-2 rounded-md border text-sm font-mono font-medium transition-colors ${
                      active ? "bg-accent text-accent-foreground border-accent" : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
                    }`}>{c}</button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Manual verification flags" desc="Trigger manual review for sensitive cases." />
            <div className="space-y-3">
              {FLAGS.map((f) => (
                <label key={f.key} className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-accent/40 hover:bg-accent-soft/30 cursor-pointer transition-colors">
                  <Checkbox checked={flags[f.key]} onCheckedChange={(v) => setFlags((s) => ({ ...s, [f.key]: !!v }))} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{f.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default CreateProduct;
