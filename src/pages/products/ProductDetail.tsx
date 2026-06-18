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
import { Checkbox } from "@/components/ui/checkbox";
import {
  getProduct, updateProductFlags, updateProduct, ProductStatus, Product,
  PRODUCT_GROUPS, POLICY_TYPES, INSURANCE_AMOUNT_TYPES,
  PREMIUM_PAYMENT_TYPES, PACKET_PAYMENT_TYPES, PACKET_RENEWAL_TYPES,
  PACKET_LOAN_TYPES, LOAN_PRODUCT_TYPES, ACTUARIAL_CODES,
  PAYMENT_MODELS, listTariffs, listProductCoverages, getPremiumTable,
  listPremiumTables, addPremiumTable, updatePremiumTable,
  addTariff, updateTariff, removeTariff,
  PremiumTable, PremiumTableItem, Tariff,
  ProductSetupDetails, ProductPaymentDetails, ProductLoanDetails,
  ProductInternalDetails, ProductExternalDetails, PaymentModel,
} from "@/data/products";
import { Check, AlertCircle, ScrollText, Save, X, Plus, Trash2 } from "lucide-react";
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

// ===== Editable grouped detail tabs =====

const SectionShell = ({
  title, description, onSave, dirty, children,
}: {
  title: string; description?: string; onSave: () => void; dirty: boolean; children: React.ReactNode;
}) => (
  <Card className="shadow-card border-border overflow-hidden">
    <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Button
        size="sm"
        onClick={onSave}
        disabled={!dirty}
        className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        <Save className="h-4 w-4" /> Save changes
      </Button>
    </div>
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </Card>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

const SelectField = <T extends { value: string; label: string }>({
  options, value, onChange,
}: { options: readonly T[]; value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
    </SelectContent>
  </Select>
);

const defaultSetup: ProductSetupDetails = {
  legacyPacketId: 0, bankPartnerCode: "ISP", policyType: "WithTable",
  insuranceAmountType: "TotalAmount", legacyTariffId: 0, maxTenorMonths: 240,
  isObsolete: false, apiSubject: false, apiStraight: false,
};

const SetupTab = ({ product }: { product: Product }) => {
  const initial = product.setupDetails ?? defaultSetup;
  const [s, setS] = useState<ProductSetupDetails>(initial);
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);
  const save = () => { updateProduct(product.id, { setupDetails: s }); toast.success("Setup details saved"); };
  return (
    <SectionShell title="Setup details" onSave={save} dirty={dirty}>
      <Field label="Legacy packet ID">
        <Input type="number" value={s.legacyPacketId} onChange={(e) => setS({ ...s, legacyPacketId: +e.target.value })} className="font-mono" />
      </Field>
      <Field label="Bank partner">
        <Input value={s.bankPartnerCode} onChange={(e) => setS({ ...s, bankPartnerCode: e.target.value })} className="font-mono" />
      </Field>
      <Field label="Policy type">
        <SelectField options={POLICY_TYPES} value={s.policyType} onChange={(v) => setS({ ...s, policyType: v })} />
      </Field>
      <Field label="Insurance amount type">
        <SelectField options={INSURANCE_AMOUNT_TYPES} value={s.insuranceAmountType} onChange={(v) => setS({ ...s, insuranceAmountType: v })} />
      </Field>
      <Field label="Legacy tariff ID">
        <Input type="number" value={s.legacyTariffId} onChange={(e) => setS({ ...s, legacyTariffId: +e.target.value })} className="font-mono" />
      </Field>
      <Field label="Max tenor (months)">
        <Input type="number" value={s.maxTenorMonths} onChange={(e) => setS({ ...s, maxTenorMonths: +e.target.value })} className="font-mono" />
      </Field>
      <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={s.isObsolete} onCheckedChange={(v) => setS({ ...s, isObsolete: !!v })} /> Obsolete
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={s.apiSubject} onCheckedChange={(v) => setS({ ...s, apiSubject: !!v })} /> API subject
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={s.apiStraight} onCheckedChange={(v) => setS({ ...s, apiStraight: !!v })} /> API straight
        </label>
      </div>
    </SectionShell>
  );
};

const defaultPayment: ProductPaymentDetails = {
  premiumPaymentType: "NotApplicable", packetPaymentType: "NotApplicable", renewalType: "NotApplicable",
};

const PaymentTab = ({ product }: { product: Product }) => {
  const initial = product.paymentDetails ?? defaultPayment;
  const [p, setP] = useState<ProductPaymentDetails>(initial);
  const [model, setModel] = useState<PaymentModel | undefined>(product.paymentModel);
  const dirty = JSON.stringify(p) !== JSON.stringify(initial) || model !== product.paymentModel;
  const save = () => {
    updateProduct(product.id, { paymentDetails: p, paymentModel: model });
    toast.success("Payment details saved");
  };
  const applyModel = (v: PaymentModel) => {
    setModel(v);
    const m = PAYMENT_MODELS.find((x) => x.value === v);
    if (m) setP({
      premiumPaymentType: m.defaults.premiumPaymentType,
      packetPaymentType: m.defaults.packetPaymentType,
      renewalType: m.defaults.renewalType,
    });
  };
  return (
    <SectionShell title="Payment details" description="Choose a behavior model to seed defaults, then override individual fields." onSave={save} dirty={dirty}>
      <div className="md:col-span-2">
        <Field label="Payment behavior model">
          <Select value={model ?? ""} onValueChange={(v) => applyModel(v as PaymentModel)}>
            <SelectTrigger><SelectValue placeholder="Select a model" /></SelectTrigger>
            <SelectContent>
              {PAYMENT_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {model && (
          <p className="text-xs text-muted-foreground mt-2">{PAYMENT_MODELS.find((m) => m.value === model)?.description}</p>
        )}
      </div>
      <Field label="Premium payment type">
        <SelectField options={PREMIUM_PAYMENT_TYPES} value={p.premiumPaymentType} onChange={(v) => setP({ ...p, premiumPaymentType: v })} />
      </Field>
      <Field label="Packet payment type">
        <SelectField options={PACKET_PAYMENT_TYPES} value={p.packetPaymentType} onChange={(v) => setP({ ...p, packetPaymentType: v })} />
      </Field>
      <Field label="Renewal type">
        <SelectField options={PACKET_RENEWAL_TYPES} value={p.renewalType} onChange={(v) => setP({ ...p, renewalType: v })} />
      </Field>
    </SectionShell>
  );
};

const defaultLoan: ProductLoanDetails = { packetLoanType: "NotApplicable", loanProductType: "NotApplicable" };

const LoanTab = ({ product }: { product: Product }) => {
  const initial = product.loanDetails ?? defaultLoan;
  const [l, setL] = useState<ProductLoanDetails>(initial);
  const dirty = JSON.stringify(l) !== JSON.stringify(initial);
  const save = () => { updateProduct(product.id, { loanDetails: l }); toast.success("Loan details saved"); };
  return (
    <SectionShell title="Loan details" onSave={save} dirty={dirty}>
      <Field label="Packet loan type">
        <SelectField options={PACKET_LOAN_TYPES} value={l.packetLoanType} onChange={(v) => setL({ ...l, packetLoanType: v })} />
      </Field>
      <Field label="Loan product type">
        <SelectField options={LOAN_PRODUCT_TYPES} value={l.loanProductType} onChange={(v) => setL({ ...l, loanProductType: v })} />
      </Field>
    </SectionShell>
  );
};

const PremiumTableTab = ({ product }: { product: Product }) => {
  const tables = listPremiumTables();
  const [selectedId, setSelectedId] = useState<string>(product.premiumTableId ?? "");
  const [tick, setTick] = useState(0); // force re-render after item edits
  const selected = tables.find((t) => t.id === selectedId);
  const [items, setItems] = useState<PremiumTableItem[]>(selected?.items ?? []);
  const [name, setName] = useState(selected?.name ?? "");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // when selected table changes, hydrate local state
  const ensureHydrated = (id: string) => {
    setSelectedId(id);
    const t = listPremiumTables().find((x) => x.id === id);
    setItems(t?.items ?? []);
    setName(t?.name ?? "");
  };

  const linkDirty = selectedId !== (product.premiumTableId ?? "");
  const tableDirty = !!selected && (
    name !== selected.name ||
    JSON.stringify(items) !== JSON.stringify(selected.items)
  );

  const saveLink = () => { updateProduct(product.id, { premiumTableId: selectedId }); toast.success("Premium table linked"); };
  const saveTable = () => {
    if (!selected) return;
    updatePremiumTable(selected.id, { name, items });
    setTick((n) => n + 1);
    toast.success("Premium table updated");
  };

  const updateItem = (id: string, patch: Partial<PremiumTableItem>) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const addItem = () =>
    setItems((arr) => [...arr, { id: `row-${Date.now()}`, gender: "Any", minAge: 0, maxAge: 0, coefficient: 0 }]);
  const removeItem = (id: string) => setItems((arr) => arr.filter((i) => i.id !== id));

  const createTable = () => {
    if (!newName.trim()) return;
    const created = addPremiumTable(newName.trim());
    setNewName(""); setNewOpen(false);
    ensureHydrated(created.id);
    toast.success("Premium table created");
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-card border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Linked premium table</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pick an existing table or create a new one.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setNewOpen((v) => !v)}>
              <Plus className="h-4 w-4" /> New table
            </Button>
            <Button size="sm" onClick={saveLink} disabled={!linkDirty} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="h-4 w-4" /> Save link
            </Button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Select value={selectedId} onValueChange={ensureHydrated}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Select a premium table" /></SelectTrigger>
            <SelectContent>
              {tables.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.id})</SelectItem>)}
            </SelectContent>
          </Select>
          {newOpen && (
            <div className="flex gap-2 items-end pt-2 border-t border-border">
              <div className="flex-1 max-w-md">
                <Label className="text-xs">New table name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Mortality 2027 — EUR" />
              </div>
              <Button size="sm" onClick={createTable} className="bg-accent hover:bg-accent/90 text-accent-foreground">Create</Button>
            </div>
          )}
        </div>
      </Card>

      {selected && (
        <Card className="shadow-card border-border overflow-hidden" key={`${selected.id}-${tick}`}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div className="flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-semibold max-w-md" />
              <p className="text-xs text-muted-foreground mt-1">Legacy ID {selected.legacyId} · {items.length} rows</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={addItem}>
                <Plus className="h-4 w-4" /> Add row
              </Button>
              <Button size="sm" onClick={saveTable} disabled={!tableDirty} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Save className="h-4 w-4" /> Save table
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Gender</th>
                  <th className="text-left p-3">Min age</th>
                  <th className="text-left p-3">Max age</th>
                  <th className="text-left p-3">Coefficient</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-2">
                      <Select value={i.gender} onValueChange={(v) => updateItem(i.id, { gender: v as PremiumTableItem["gender"] })}>
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Any">Any</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2"><Input type="number" value={i.minAge} onChange={(e) => updateItem(i.id, { minAge: +e.target.value })} className="h-8 w-24 font-mono" /></td>
                    <td className="p-2"><Input type="number" value={i.maxAge} onChange={(e) => updateItem(i.id, { maxAge: +e.target.value })} className="h-8 w-24 font-mono" /></td>
                    <td className="p-2"><Input type="number" step="0.0001" value={i.coefficient} onChange={(e) => updateItem(i.id, { coefficient: +e.target.value })} className="h-8 w-32 font-mono" /></td>
                    <td className="p-2"><Button size="icon" variant="ghost" onClick={() => removeItem(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No rows yet — click "Add row".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

const blankTariff = (productId: string): Omit<Tariff, "id"> => ({
  productId, name: "New tariff", legacyTariffId: 0, tariffType: "Standard", currency: "EUR",
  effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "2030-12-31", isActive: true,
  minPremium: 0, maxPremium: 0, fixedPremium: 0, fixedMonthlyPremium: 0, fixedAnnualPremium: 0,
  formula: "premium = coefficient × sum_insured", notes: "",
});

const TariffsTab = ({ product }: { product: Product }) => {
  const [tick, setTick] = useState(0);
  const ts = listTariffs(product.id);
  const refresh = () => setTick((n) => n + 1);
  return (
    <div className="space-y-4" key={tick}>
      <div className="flex justify-end">
        <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => { addTariff(blankTariff(product.id)); refresh(); toast.success("Tariff added"); }}>
          <Plus className="h-4 w-4" /> Add tariff
        </Button>
      </div>
      {!ts.length && <Card className="p-8 text-center text-sm text-muted-foreground">No tariffs configured for this product.</Card>}
      {ts.map((t) => <TariffEditor key={t.id} tariff={t} onChange={refresh} />)}
    </div>
  );
};

const TariffEditor = ({ tariff, onChange }: { tariff: Tariff; onChange: () => void }) => {
  const [t, setT] = useState<Tariff>(tariff);
  const dirty = JSON.stringify(t) !== JSON.stringify(tariff);
  const save = () => { updateTariff(tariff.id, t); onChange(); toast.success("Tariff saved"); };
  const del = () => { removeTariff(tariff.id); onChange(); toast.success("Tariff removed"); };
  return (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <Input value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} className="font-semibold max-w-md" />
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={t.isActive} onCheckedChange={(v) => setT({ ...t, isActive: v })} /> Active
          </label>
          <Button size="sm" variant="outline" onClick={del} className="gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Remove</Button>
          <Button size="sm" onClick={save} disabled={!dirty} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"><Save className="h-4 w-4" /> Save</Button>
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field label="Tariff type"><Input value={t.tariffType} onChange={(e) => setT({ ...t, tariffType: e.target.value })} /></Field>
        <Field label="Currency">
          <Select value={t.currency} onValueChange={(v) => setT({ ...t, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ALL_CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Legacy tariff ID"><Input type="number" value={t.legacyTariffId} onChange={(e) => setT({ ...t, legacyTariffId: +e.target.value })} className="font-mono" /></Field>
        <Field label="Effective from"><Input type="date" value={t.effectiveFrom} onChange={(e) => setT({ ...t, effectiveFrom: e.target.value })} /></Field>
        <Field label="Effective to"><Input type="date" value={t.effectiveTo} onChange={(e) => setT({ ...t, effectiveTo: e.target.value })} /></Field>
        <Field label="Min premium"><Input type="number" value={t.minPremium} onChange={(e) => setT({ ...t, minPremium: +e.target.value })} className="font-mono" /></Field>
        <Field label="Max premium"><Input type="number" value={t.maxPremium} onChange={(e) => setT({ ...t, maxPremium: +e.target.value })} className="font-mono" /></Field>
        <Field label="Fixed premium"><Input type="number" value={t.fixedPremium} onChange={(e) => setT({ ...t, fixedPremium: +e.target.value })} className="font-mono" /></Field>
        <Field label="Fixed monthly"><Input type="number" value={t.fixedMonthlyPremium} onChange={(e) => setT({ ...t, fixedMonthlyPremium: +e.target.value })} className="font-mono" /></Field>
        <Field label="Fixed annual"><Input type="number" value={t.fixedAnnualPremium} onChange={(e) => setT({ ...t, fixedAnnualPremium: +e.target.value })} className="font-mono" /></Field>
        <div className="md:col-span-3"><Field label="Formula"><Input value={t.formula} onChange={(e) => setT({ ...t, formula: e.target.value })} className="font-mono" /></Field></div>
        <div className="md:col-span-3"><Field label="Notes"><Textarea rows={2} value={t.notes} onChange={(e) => setT({ ...t, notes: e.target.value })} /></Field></div>
      </div>
    </Card>
  );
};

const defaultInternal: ProductInternalDetails = { coveragePrintableText: "", packetFinType: null };
const InternalTab = ({ product }: { product: Product }) => {
  const initial = product.internalDetails ?? defaultInternal;
  const [i, setI] = useState<ProductInternalDetails>(initial);
  const dirty = JSON.stringify(i) !== JSON.stringify(initial);
  const save = () => { updateProduct(product.id, { internalDetails: i }); toast.success("Internal details saved"); };
  return (
    <SectionShell title="Internal details" onSave={save} dirty={dirty}>
      <div className="md:col-span-2">
        <Field label="Coverage printable text">
          <Textarea rows={3} value={i.coveragePrintableText} onChange={(e) => setI({ ...i, coveragePrintableText: e.target.value })} />
        </Field>
      </div>
      <Field label="Packet fin type">
        <Input type="number" value={i.packetFinType ?? ""} onChange={(e) => setI({ ...i, packetFinType: e.target.value === "" ? null : +e.target.value })} className="font-mono" />
      </Field>
    </SectionShell>
  );
};

const defaultExternal: ProductExternalDetails = {
  sapProductCode: "", sapChannelCode: "", f5ProductCode: "", actuarialProductCode: "RegularPersonal",
};
const ExternalTab = ({ product }: { product: Product }) => {
  const initial = product.externalDetails ?? defaultExternal;
  const [e, setE] = useState<ProductExternalDetails>(initial);
  const dirty = JSON.stringify(e) !== JSON.stringify(initial);
  const save = () => { updateProduct(product.id, { externalDetails: e }); toast.success("External details saved"); };
  return (
    <SectionShell title="External details" onSave={save} dirty={dirty}>
      <Field label="SAP product code"><Input value={e.sapProductCode} onChange={(ev) => setE({ ...e, sapProductCode: ev.target.value })} className="font-mono" /></Field>
      <Field label="SAP channel code"><Input value={e.sapChannelCode} onChange={(ev) => setE({ ...e, sapChannelCode: ev.target.value })} className="font-mono" /></Field>
      <Field label="F5 product code"><Input value={e.f5ProductCode} onChange={(ev) => setE({ ...e, f5ProductCode: ev.target.value })} className="font-mono" /></Field>
      <Field label="Actuarial product code">
        <SelectField options={ACTUARIAL_CODES} value={e.actuarialProductCode} onChange={(v) => setE({ ...e, actuarialProductCode: v })} />
      </Field>
    </SectionShell>
  );
};

export default ProductDetail;

