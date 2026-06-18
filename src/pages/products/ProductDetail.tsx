import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getProduct, updateProductFlags, updateProduct, ProductStatus, Product,
  PRODUCT_GROUPS, POLICY_TYPES, INSURANCE_AMOUNT_TYPES,
  PREMIUM_PAYMENT_TYPES, PACKET_PAYMENT_TYPES, PACKET_RENEWAL_TYPES,
  PACKET_LOAN_TYPES, LOAN_PRODUCT_TYPES, ACTUARIAL_CODES,
  PAYMENT_MODELS, listTariffs, listProductCoverages, getPremiumTable,
} from "@/data/products";
import { Check, AlertCircle, ScrollText, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import VersionsTab from "./VersionsTab";
import CoveragesTab from "./CoveragesTab";
import PremiumRulesTab from "./PremiumRulesTab";
import TemplatesTab from "./TemplatesTab";
import DocumentsTab from "./DocumentsTab";

const statusClass: Record<ProductStatus, string> = {
  Active: "bg-success/15 text-success",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-destructive/10 text-destructive",
};

const ALL_CURRENCIES = ["EUR", "ALL", "USD", "GBP", "CHF"];


const FLAG_DEFS: { key: keyof Product["flags"]; label: string; hint: string }[] = [
  { key: "pep", label: "PEP check required", hint: "Politically Exposed Persons trigger enhanced due-diligence." },
  { key: "highInsuredAmount", label: "High insured amount requires review", hint: "Sum insured above the product threshold goes to manual review." },
  { key: "totalExposure", label: "Total customer exposure requires review", hint: "If the customer's combined exposure across policies exceeds the limit." },
  { key: "manualUnderwriting", label: "Manual underwriting required", hint: "Every application is routed to an underwriter regardless of other rules." },
  { key: "compliance", label: "Compliance review required", hint: "An additional compliance officer sign-off is mandatory before issuance." },
];

type EditableFields = {
  name: string;
  code: string;
  status: ProductStatus;
  type: string;
  description: string;
  currencies: string[];
  requiredDocuments: string[];
  agentCommissionPct: string;
  bankCommissionPct: string;
};

const ProductDetail = () => {
  const { id } = useParams();
  const product = id ? getProduct(id) : undefined;

  const [flags, setFlags] = useState<Product["flags"] | null>(product?.flags ?? null);
  const [fields, setFields] = useState<EditableFields | null>(
    product
      ? {
          name: product.name,
          code: product.code,
          status: product.status,
          type: product.type,
          description: product.description,
          currencies: [...product.currencies],
          requiredDocuments: [...product.requiredDocuments],
          agentCommissionPct: parseFloat((product.agentCommission * 100).toFixed(6)).toString(),
          bankCommissionPct: parseFloat((product.bankCommission * 100).toFixed(6)).toString(),
        }
      : null
  );
  const [newDoc, setNewDoc] = useState("");

  if (!product || !flags || !fields) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Not found" }]}
          title="Product not found"
        />
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This product no longer exists.</p>
          <Button asChild className="mt-4"><Link to="/products">Back to products</Link></Button>
        </Card>
      </AppShell>
    );
  }

  const dirty = JSON.stringify(flags) !== JSON.stringify(product.flags);
  const fieldsDirty =
    fields.name !== product.name ||
    fields.code !== product.code ||
    fields.status !== product.status ||
    fields.type !== product.type ||
    fields.description !== product.description ||
    JSON.stringify(fields.currencies) !== JSON.stringify(product.currencies) ||
    JSON.stringify(fields.requiredDocuments) !== JSON.stringify(product.requiredDocuments) ||
    (parseFloat(fields.agentCommissionPct) || 0) / 100 !== product.agentCommission ||
    (parseFloat(fields.bankCommissionPct) || 0) / 100 !== product.bankCommission;

  const toggleFlag = (key: keyof Product["flags"]) =>
    setFlags((f) => (f ? { ...f, [key]: !f[key] } : f));

  const saveFlags = () => {
    updateProductFlags(product.id, flags);
    toast.success("Verification rules saved");
  };

  const saveFields = () => {
    const { agentCommissionPct, bankCommissionPct, ...rest } = fields;
    updateProduct(product.id, {
      ...rest,
      agentCommission: (parseFloat(agentCommissionPct) || 0) / 100,
      bankCommission: (parseFloat(bankCommissionPct) || 0) / 100,
    });
    toast.success("Product details saved");
  };

  const toggleCurrency = (c: string) =>
    setFields((f) =>
      f
        ? { ...f, currencies: f.currencies.includes(c) ? f.currencies.filter((x) => x !== c) : [...f.currencies, c] }
        : f
    );

  const addDoc = () => {
    const v = newDoc.trim();
    if (!v) return;
    setFields((f) => (f ? { ...f, requiredDocuments: [...f.requiredDocuments, v] } : f));
    setNewDoc("");
  };

  const removeDoc = (d: string) =>
    setFields((f) => (f ? { ...f, requiredDocuments: f.requiredDocuments.filter((x) => x !== d) } : f));

  const flagList = FLAG_DEFS.map((f) => ({ ...f, on: flags[f.key] }));

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
        title={product.name}
        description={product.description}
      />

      {/* Summary strip */}
      <Card className="p-5 mb-6 shadow-card border-border">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Code</div>
            <div className="font-mono text-sm text-accent mt-0.5">{product.code}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</div>
            <Badge className={`mt-0.5 font-medium border-0 ${statusClass[product.status]}`}>{product.status}</Badge>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Type</div>
            <div className="text-sm mt-0.5">{product.type}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Version</div>
            <div className="font-mono text-sm mt-0.5">{product.activeVersion}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Currencies</div>
            <div className="flex gap-1 mt-0.5">
              {product.currencies.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px] font-mono px-1.5 py-0">{c}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Created</div>
            <div className="text-sm mt-0.5">{product.createdDate}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Agent Comm.</div>
            <div className="font-mono text-sm mt-0.5">{(product.agentCommission * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bank Comm.</div>
            <div className="font-mono text-sm mt-0.5">{(product.bankCommission * 100).toFixed(2)}%</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="loan">Loan</TabsTrigger>
          <TabsTrigger value="premium-table">Premium Table</TabsTrigger>
          <TabsTrigger value="tariffs">Tariffs</TabsTrigger>
          <TabsTrigger value="coverages">Coverages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="premium">Premium Rules</TabsTrigger>
          <TabsTrigger value="internal">Internal</TabsTrigger>
          <TabsTrigger value="external">External</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Product details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Edit the core attributes of this product.
                </p>
              </div>
              <Button
                size="sm"
                onClick={saveFields}
                disabled={!fieldsDirty}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-code">Code</Label>
                <Input id="p-code" value={fields.code} onChange={(e) => setFields({ ...fields, code: e.target.value })} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={fields.status} onValueChange={(v) => setFields({ ...fields, status: v as ProductStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-type">Type</Label>
                <Input id="p-type" value={fields.type} onChange={(e) => setFields({ ...fields, type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-agent-comm">Agent Commission (%)</Label>
                <div className="relative">
                  <Input
                    id="p-agent-comm"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={fields.agentCommissionPct}
                    onChange={(e) => setFields({ ...fields, agentCommissionPct: e.target.value })}
                    className="pr-7 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-bank-comm">Bank Commission (%)</Label>
                <div className="relative">
                  <Input
                    id="p-bank-comm"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={fields.bankCommissionPct}
                    onChange={(e) => setFields({ ...fields, bankCommissionPct: e.target.value })}
                    className="pr-7 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  rows={4}
                  value={fields.description}
                  onChange={(e) => setFields({ ...fields, description: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Currencies</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CURRENCIES.map((c) => {
                    const on = fields.currencies.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCurrency(c)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                          on
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background text-muted-foreground border-border hover:border-accent/50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Required documents</Label>
                <div className="flex flex-wrap gap-1.5">
                  {fields.requiredDocuments.map((d) => (
                    <Badge key={d} className="bg-accent-soft text-accent-soft-foreground border-0 gap-1 pr-1">
                      {d}
                      <button
                        type="button"
                        onClick={() => removeDoc(d)}
                        className="rounded-sm hover:bg-background/50 p-0.5"
                        aria-label={`Remove ${d}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add required document…"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDoc();
                      }
                    }}
                    className="max-w-xs h-9"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addDoc} className="gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Verification flags (summary)
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {flagList.map((f) => (
                <li key={f.key} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 h-4 w-4 rounded-sm flex items-center justify-center ${f.on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {f.on && <Check className="h-3 w-3" />}
                  </span>
                  <span className={f.on ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <VersionsTab productId={product.id} />
        </TabsContent>

        <TabsContent value="setup">
          <SetupTab product={product} />
        </TabsContent>
        <TabsContent value="payment">
          <PaymentTab product={product} />
        </TabsContent>
        <TabsContent value="loan">
          <LoanTab product={product} />
        </TabsContent>
        <TabsContent value="premium-table">
          <PremiumTableTab product={product} />
        </TabsContent>
        <TabsContent value="tariffs">
          <TariffsTab product={product} />
        </TabsContent>
        <TabsContent value="internal">
          <InternalTab product={product} />
        </TabsContent>
        <TabsContent value="external">
          <ExternalTab product={product} />
        </TabsContent>


        <TabsContent value="coverages">
          <CoveragesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="premium">
          <PremiumRulesTab productId={product.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab productId={product.id} />
        </TabsContent>

        <TabsContent value="verification">
          <Card className="shadow-card border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-accent" /> Verification rules
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle the conditions that route an application to manual review.
                </p>
              </div>
              <Button
                size="sm"
                onClick={saveFlags}
                disabled={!dirty}
                className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </div>
            <div className="divide-y divide-border">
              {flagList.map((f) => (
                <label
                  key={f.key}
                  htmlFor={`flag-${f.key}`}
                  className="flex items-center justify-between px-5 py-4 gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-0.5 h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${
                        f.on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{f.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.hint}</div>
                    </div>
                  </div>
                  <Switch
                    id={`flag-${f.key}`}
                    checked={f.on}
                    onCheckedChange={() => toggleFlag(f.key)}
                  />
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

// ===== Grouped detail tabs =====
const labelFor = <T extends { value: string; label: string }>(arr: readonly T[], v?: string) =>
  arr.find((x) => x.value === v)?.label ?? v ?? "—";

const InfoRow = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex flex-col gap-1 py-2.5 border-b border-border last:border-0">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
    <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
  </div>
);

const GroupedCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="shadow-card border-border">
    <div className="px-5 py-4 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6">{children}</div>
  </Card>
);

const SetupTab = ({ product }: { product: Product }) => {
  const s = product.setupDetails;
  return (
    <GroupedCard title="Setup details">
      <InfoRow label="Legacy packet ID" value={s?.legacyPacketId} mono />
      <InfoRow label="Bank partner" value={s?.bankPartnerCode} mono />
      <InfoRow label="Policy type" value={labelFor(POLICY_TYPES, s?.policyType)} />
      <InfoRow label="Insurance amount type" value={labelFor(INSURANCE_AMOUNT_TYPES, s?.insuranceAmountType)} />
      <InfoRow label="Legacy tariff ID" value={s?.legacyTariffId} mono />
      <InfoRow label="Max tenor (months)" value={s?.maxTenorMonths} mono />
      <InfoRow label="Obsolete" value={s?.isObsolete ? "Yes" : "No"} />
      <InfoRow label="API subject / API straight" value={`${s?.apiSubject ? "Yes" : "No"} / ${s?.apiStraight ? "Yes" : "No"}`} />
    </GroupedCard>
  );
};

const PaymentTab = ({ product }: { product: Product }) => {
  const p = product.paymentDetails;
  const m = PAYMENT_MODELS.find((x) => x.value === product.paymentModel);
  return (
    <div className="space-y-5">
      {m && (
        <Card className="shadow-card border-border p-5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Payment behavior model</div>
          <div className="text-sm font-semibold text-foreground">{m.label}</div>
          <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
        </Card>
      )}
      <GroupedCard title="Payment details">
        <InfoRow label="Premium payment type" value={labelFor(PREMIUM_PAYMENT_TYPES, p?.premiumPaymentType)} />
        <InfoRow label="Packet payment type" value={labelFor(PACKET_PAYMENT_TYPES, p?.packetPaymentType)} />
        <InfoRow label="Renewal type" value={labelFor(PACKET_RENEWAL_TYPES, p?.renewalType)} />
      </GroupedCard>
    </div>
  );
};

const LoanTab = ({ product }: { product: Product }) => {
  const l = product.loanDetails;
  return (
    <GroupedCard title="Loan details">
      <InfoRow label="Packet loan type" value={labelFor(PACKET_LOAN_TYPES, l?.packetLoanType)} />
      <InfoRow label="Loan product type" value={labelFor(LOAN_PRODUCT_TYPES, l?.loanProductType)} />
    </GroupedCard>
  );
};

const PremiumTableTab = ({ product }: { product: Product }) => {
  const t = getPremiumTable(product.premiumTableId);
  if (!t) return <Card className="p-8 text-center text-sm text-muted-foreground">No premium table assigned.</Card>;
  return (
    <Card className="shadow-card border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Legacy ID {t.legacyId} · {t.items.length} rows</p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">{t.id}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">Gender</th><th className="text-left p-3">Min age</th><th className="text-left p-3">Max age</th><th className="text-left p-3">Coefficient</th></tr>
          </thead>
          <tbody>
            {t.items.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3">{i.gender}</td>
                <td className="p-3 font-mono">{i.minAge}</td>
                <td className="p-3 font-mono">{i.maxAge}</td>
                <td className="p-3 font-mono">{i.coefficient}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const TariffsTab = ({ product }: { product: Product }) => {
  const ts = listTariffs(product.id);
  if (!ts.length) return <Card className="p-8 text-center text-sm text-muted-foreground">No tariffs configured for this product.</Card>;
  return (
    <div className="space-y-4">
      {ts.map((t) => (
        <Card key={t.id} className="shadow-card border-border p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.tariffType} · {t.currency} · Legacy ID {t.legacyTariffId}</p>
            </div>
            <Badge className={t.isActive ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
              {t.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
            <InfoRow label="Effective from" value={t.effectiveFrom} mono />
            <InfoRow label="Effective to" value={t.effectiveTo} mono />
            <InfoRow label="Min / Max premium" value={`${t.minPremium} / ${t.maxPremium}`} mono />
            <InfoRow label="Fixed premium" value={t.fixedPremium} mono />
            <InfoRow label="Fixed monthly" value={t.fixedMonthlyPremium} mono />
            <InfoRow label="Fixed annual" value={t.fixedAnnualPremium} mono />
            <InfoRow label="Formula" value={<span className="font-mono text-xs">{t.formula}</span>} />
            <InfoRow label="Notes" value={t.notes} />
          </div>
        </Card>
      ))}
    </div>
  );
};

const InternalTab = ({ product }: { product: Product }) => {
  const i = product.internalDetails;
  return (
    <GroupedCard title="Internal details">
      <div className="sm:col-span-2"><InfoRow label="Coverage printable text" value={i?.coveragePrintableText} /></div>
      <InfoRow label="Packet fin type" value={i?.packetFinType ?? "—"} mono />
    </GroupedCard>
  );
};

const ExternalTab = ({ product }: { product: Product }) => {
  const e = product.externalDetails;
  return (
    <GroupedCard title="External details">
      <InfoRow label="SAP product code" value={e?.sapProductCode} mono />
      <InfoRow label="SAP channel code" value={e?.sapChannelCode} mono />
      <InfoRow label="F5 product code" value={e?.f5ProductCode} mono />
      <InfoRow label="Actuarial product code" value={labelFor(ACTUARIAL_CODES, e?.actuarialProductCode)} />
    </GroupedCard>
  );
};

export default ProductDetail;

