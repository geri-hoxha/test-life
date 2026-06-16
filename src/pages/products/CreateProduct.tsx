import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  addProduct, ProductStatus,
  PRODUCT_GROUPS, POLICY_TYPES, INSURANCE_AMOUNT_TYPES,
  PREMIUM_PAYMENT_TYPES, PACKET_PAYMENT_TYPES, PACKET_RENEWAL_TYPES,
  PACKET_LOAN_TYPES, LOAN_PRODUCT_TYPES, ACTUARIAL_CODES, BANK_PARTNERS,
  listPremiumTables, addPremiumTable,
} from "@/data/products";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const ALL_CURRENCIES = ["EUR", "ALL", "USD"] as const;

const DOC_OPTIONS = [
  "ID document",
  "Medical questionnaire",
  "Medical report",
  "Proof of income",
  "Proof of address",
  "Beneficiary declaration",
];

const FLAGS = [
  { key: "pep", label: "PEP check required", desc: "Politically Exposed Person screening before issuance." },
  { key: "highInsuredAmount", label: "High insured amount requires review", desc: "Trigger underwriter review above threshold." },
  { key: "totalExposure", label: "Total customer exposure requires review", desc: "Aggregate exposure across all policies." },
  { key: "manualUnderwriting", label: "Manual underwriting required", desc: "Always route to underwriter, skip auto-approval." },
  { key: "compliance", label: "Compliance review required", desc: "AML / regulatory compliance officer sign-off." },
] as const;

// Small helpers for compact section labels
const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="mb-5">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
  </div>
);

const CreateProduct = () => {
  const navigate = useNavigate();

  // General
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const type = "Life Insurance";
  const [status, setStatus] = useState<ProductStatus>("Draft");
  const [productGroup, setProductGroup] = useState<string>("GroupLife");
  const [currencies, setCurrencies] = useState<string[]>(["EUR"]);
  const [agentCommissionPct, setAgentCommissionPct] = useState<string>("0");
  const [bankCommissionPct, setBankCommissionPct] = useState<string>("0");

  // Premium table
  const [tables, setTables] = useState(() => listPremiumTables());
  const [premiumTableId, setPremiumTableId] = useState<string>(tables[0]?.id ?? "");
  const [showNewTable, setShowNewTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  const createTable = () => {
    const v = newTableName.trim();
    if (!v) return;
    const t = addPremiumTable(v);
    setTables(listPremiumTables());
    setPremiumTableId(t.id);
    setNewTableName("");
    setShowNewTable(false);
    toast.success(`Premium table "${t.name}" created`);
  };

  // Setup details
  const [legacyPacketId, setLegacyPacketId] = useState("0");
  const [bankPartnerCode, setBankPartnerCode] = useState<string>("BKT");
  const [policyType, setPolicyType] = useState<string>("WithTable");
  const [insuranceAmountType, setInsuranceAmountType] = useState<string>("TotalAmount");
  const [legacyTariffId, setLegacyTariffId] = useState("0");
  const [maxTenorMonths, setMaxTenorMonths] = useState("240");
  const [isObsolete, setIsObsolete] = useState(false);
  const [apiSubject, setApiSubject] = useState(false);
  const [apiStraight, setApiStraight] = useState(false);

  // Payment details
  const [premiumPaymentType, setPremiumPaymentType] = useState<string>("CurrentInsuranceYearPremium");
  const [packetPaymentType, setPacketPaymentType] = useState<string>("RegularPremiumPayment");
  const [renewalType, setRenewalType] = useState<string>("AccordingToTable");

  // Loan details
  const [packetLoanType, setPacketLoanType] = useState<string>("NotApplicable");
  const [loanProductType, setLoanProductType] = useState<string>("NotApplicable");

  // Internal details
  const [coveragePrintableText, setCoveragePrintableText] = useState("");
  const [packetFinType, setPacketFinType] = useState("");

  // External details
  const [sapProductCode, setSapProductCode] = useState("");
  const [sapChannelCode, setSapChannelCode] = useState("");
  const [f5ProductCode, setF5ProductCode] = useState("");
  const [actuarialProductCode, setActuarialProductCode] = useState<string>("RegularTerm");

  // Documents & flags
  const [docs, setDocs] = useState<string[]>(["ID document"]);
  const [newDoc, setNewDoc] = useState("");
  const [flags, setFlags] = useState({
    pep: false, highInsuredAmount: false, totalExposure: false, manualUnderwriting: false, compliance: false,
  });

  const toggleCurrency = (c: string) =>
    setCurrencies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const addDoc = (d: string) => {
    const v = d.trim();
    if (!v || docs.includes(v)) return;
    setDocs([...docs, v]);
    setNewDoc("");
  };

  const handleSave = () => {
    if (!name || !code) {
      toast.error("Name and code are required");
      return;
    }
    const created = addProduct({
      name, code, description, type, status,
      currencies, requiredDocuments: docs, flags,
      agentCommission: (parseFloat(agentCommissionPct) || 0) / 100,
      bankCommission: (parseFloat(bankCommissionPct) || 0) / 100,
      productGroup: productGroup as any,
      premiumTableId,
      setupDetails: {
        legacyPacketId: parseInt(legacyPacketId, 10) || 0,
        bankPartnerCode,
        policyType,
        insuranceAmountType,
        legacyTariffId: parseInt(legacyTariffId, 10) || 0,
        maxTenorMonths: parseInt(maxTenorMonths, 10) || 0,
        isObsolete, apiSubject, apiStraight,
      },
      paymentDetails: { premiumPaymentType, packetPaymentType, renewalType },
      loanDetails: { packetLoanType, loanProductType },
      internalDetails: {
        coveragePrintableText,
        packetFinType: packetFinType === "" ? null : parseInt(packetFinType, 10) || null,
      },
      externalDetails: {
        sapProductCode, sapChannelCode, f5ProductCode, actuarialProductCode,
      },
    });
    toast.success(`Product ${created.code} created`);
    navigate(`/products/${created.id}`);
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Create" }]}
        title="Create Product"
        description="Define a new life-insurance product. You can refine versions, coverages and rules afterwards."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/products">Cancel</Link></Button>
            <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Save Product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* General */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="General information" desc="Basic identity of the product." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TermLife Plus 20Y" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Product Code *</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 05" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group">Product Group</Label>
                <Select value={productGroup} onValueChange={setProductGroup}>
                  <SelectTrigger id="group"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_GROUPS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent-comm">Agent Commission (%)</Label>
                <div className="relative">
                  <Input id="agent-comm" type="number" min="0" max="100" step="0.01" value={agentCommissionPct} onChange={(e) => setAgentCommissionPct(e.target.value)} className="pr-7 font-mono" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank-comm">Bank Commission (%)</Label>
                <div className="relative">
                  <Input id="bank-comm" type="number" min="0" max="100" step="0.01" value={bankCommissionPct} onChange={(e) => setBankCommissionPct(e.target.value)} className="pr-7 font-mono" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short marketing or internal description" />
              </div>
            </div>
          </Card>

          {/* Premium table */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Premium table" desc="Mortality / coefficient table used to calculate premiums." />
            <div className="flex gap-2 items-end">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="ptable">Table</Label>
                <Select value={premiumTableId} onValueChange={setPremiumTableId}>
                  <SelectTrigger id="ptable"><SelectValue placeholder="Select table…" /></SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{t.id}</span>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showNewTable} onOpenChange={setShowNewTable}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="gap-1.5">
                    <Plus className="h-4 w-4" /> New table
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New premium table</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-1.5">
                    <Label htmlFor="nt">Table name</Label>
                    <Input id="nt" value={newTableName} onChange={(e) => setNewTableName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createTable()}
                      placeholder="e.g. Mortality Table 2026" autoFocus />
                    <p className="text-xs text-muted-foreground">Rows (age × gender × coefficient) can be configured after creation.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTable(false)}>Cancel</Button>
                    <Button onClick={createTable} className="bg-accent text-accent-foreground hover:bg-accent/90">Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Setup details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Setup details" desc="Core business setup inherited from the legacy packet definition." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Bank partner</Label>
                <Select value={bankPartnerCode} onValueChange={setBankPartnerCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANK_PARTNERS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Policy type</Label>
                <Select value={policyType} onValueChange={setPolicyType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Insurance amount type</Label>
                <Select value={insuranceAmountType} onValueChange={setInsuranceAmountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INSURANCE_AMOUNT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Max tenor (months)</Label>
                <Input type="number" min="0" value={maxTenorMonths} onChange={(e) => setMaxTenorMonths(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Legacy packet ID</Label>
                <Input type="number" min="0" value={legacyPacketId} onChange={(e) => setLegacyPacketId(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Legacy tariff ID</Label>
                <Input type="number" min="0" value={legacyTariffId} onChange={(e) => setLegacyTariffId(e.target.value)} className="font-mono" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
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

          {/* Payment details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Payment details" desc="How premiums are calculated, collected and renewed." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Premium payment</Label>
                <Select value={premiumPaymentType} onValueChange={setPremiumPaymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PREMIUM_PAYMENT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Packet payment</Label>
                <Select value={packetPaymentType} onValueChange={setPacketPaymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PACKET_PAYMENT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Renewal</Label>
                <Select value={renewalType} onValueChange={setRenewalType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PACKET_RENEWAL_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Loan details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Loan details" desc="Loan-related configuration for bancassurance products." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Packet loan type</Label>
                <Select value={packetLoanType} onValueChange={setPacketLoanType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PACKET_LOAN_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Loan product</Label>
                <Select value={loanProductType} onValueChange={setLoanProductType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOAN_PRODUCT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Internal details */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Internal details" desc="ESIG Life internal configuration not exposed externally." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Coverage printable text</Label>
                <Textarea rows={2} value={coveragePrintableText} onChange={(e) => setCoveragePrintableText(e.target.value)}
                  placeholder="Wording printed on policy schedules and documents." />
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
              <div className="space-y-1.5">
                <Label>SAP product code</Label>
                <Input value={sapProductCode} onChange={(e) => setSapProductCode(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>SAP channel code</Label>
                <Input value={sapChannelCode} onChange={(e) => setSapChannelCode(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>F5 product code</Label>
                <Input value={f5ProductCode} onChange={(e) => setF5ProductCode(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Actuarial product code</Label>
                <Select value={actuarialProductCode} onValueChange={setActuarialProductCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTUARIAL_CODES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Required documents */}
          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Required documents" desc="Documents the customer must submit when applying." />
            <div className="flex flex-wrap gap-2 mb-4">
              {docs.map((d) => (
                <Badge key={d} className="bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft border-0 gap-1 pl-2.5 pr-1 py-1">
                  {d}
                  <button onClick={() => setDocs(docs.filter((x) => x !== d))} className="rounded hover:bg-accent/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {docs.length === 0 && <span className="text-xs text-muted-foreground">No documents added.</span>}
            </div>
            <div className="flex gap-2">
              <Input
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc(newDoc))}
                placeholder="Add custom document…"
              />
              <Button type="button" variant="outline" onClick={() => addDoc(newDoc)}>Add</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
              {DOC_OPTIONS.filter((d) => !docs.includes(d)).map((d) => (
                <button key={d} onClick={() => addDoc(d)} className="text-xs px-2 py-0.5 rounded border border-dashed border-border hover:border-accent hover:text-accent">
                  + {d}
                </button>
              ))}
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
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCurrency(c)}
                    className={`px-4 py-2 rounded-md border text-sm font-mono font-medium transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <SectionTitle title="Manual verification flags" desc="Trigger manual review for sensitive cases." />
            <div className="space-y-3">
              {FLAGS.map((f) => (
                <label key={f.key} className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-accent/40 hover:bg-accent-soft/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={flags[f.key]}
                    onCheckedChange={(v) => setFlags((s) => ({ ...s, [f.key]: !!v }))}
                    className="mt-0.5"
                  />
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
