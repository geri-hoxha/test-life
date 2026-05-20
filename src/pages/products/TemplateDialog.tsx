import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Template, PremiumOverrideType, PaymentType, RenewalType,
  TemplateTypeCode, LoanType, PolicyTypeCode, newTemplateId,
  SELLER_DIRECTORY, SellerType,
} from "@/data/templates";
import { listCoverages } from "@/data/coverages";
import { Shield, ShieldPlus, Search, X, UserCircle2, Building2, Store } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  versionId: string;
  productCurrencies: string[];
  initial?: Template | null;
  onSave: (t: Template) => void;
};

const blank = (productId: string, versionId: string, currencies: string[]): Template => ({
  id: newTemplateId(),
  productId, versionId,
  name: "",
  description: "",
  includedCoverageIds: [],
  optionalRiderIds: [],
  defaultCurrency: currencies[0] ?? "EUR",
  allowedCurrencies: [currencies[0] ?? "EUR"],
  premiumOverrideType: "No override",
  premiumOverrideValue: 0,
  agentCommission: 0.07,
  bankCommission: 0.03,
  paymentType: "Payment with regulated premium",
  renewalType: "Automatic annual renewal",
  typeCode: "RP",
  loanType: "Not applicable",
  policyType: "D20V - Up to 20 years",
  quantity: 1,
  maxMonths: 240,
  printType: "9",
  cancelled: false,
  isActive: true,
  allowedSellerIds: [],
});

const OVERRIDES: PremiumOverrideType[] = [
  "No override",
  "Fixed discount",
  "Percentage discount",
  "Fixed premium",
  "Management approved manual premium",
];

const PAYMENT_TYPES: PaymentType[] = [
  "Payment with regulated premium",
  "Single premium payment",
  "Flexible premium payment",
  "Bank-financed premium",
];

const RENEWAL_TYPES: RenewalType[] = [
  "According to the bank information",
  "Automatic annual renewal",
  "Manual renewal on request",
  "Non-renewable",
];

const TYPE_CODES: TemplateTypeCode[] = ["LP", "RP", "SP", "GP", "BP"];

const LOAN_TYPES: LoanType[] = [
  "Personal loan",
  "Mortgage loan",
  "Business loan",
  "Consumer loan",
  "Not applicable",
];

const POLICY_TYPES: PolicyTypeCode[] = [
  "D1V - Up to 1 year",
  "D5V - Up to 5 years",
  "D10V - Up to 10 years",
  "D20V - Up to 20 years",
  "WL - Whole life",
];

const TemplateDialog = ({ open, onOpenChange, productId, versionId, productCurrencies, initial, onSave }: Props) => {
  const [t, setT] = useState<Template>(initial ?? blank(productId, versionId, productCurrencies));
  const [sellerQuery, setSellerQuery] = useState("");

  useEffect(() => {
    setT(initial ?? blank(productId, versionId, productCurrencies));
  }, [initial, productId, versionId, productCurrencies, open]);

  const set = <K extends keyof Template>(k: K, v: Template[K]) => setT((s) => ({ ...s, [k]: v }));

  const allCoverages = useMemo(() => listCoverages(productId, versionId), [productId, versionId]);
  const mandatory = allCoverages.filter((c) => c.coverageType === "Mandatory");
  const riders = allCoverages.filter((c) => c.coverageType === "Optional Rider");

  const toggleArr = (key: "includedCoverageIds" | "optionalRiderIds" | "allowedCurrencies" | "allowedSellerIds", val: string) =>
    setT((s) => ({
      ...s,
      [key]: s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val],
    }));

  const sellerResults = useMemo(() => {
    const q = sellerQuery.trim().toLowerCase();
    if (!q) return [];
    return SELLER_DIRECTORY
      .filter((s) => !t.allowedSellerIds.includes(s.id))
      .filter((s) => s.name.toLowerCase().includes(q) || (s.code ?? "").toLowerCase().includes(q))
      .slice(0, 6);
  }, [sellerQuery, t.allowedSellerIds]);

  const selectedSellers = useMemo(
    () => t.allowedSellerIds.map((id) => SELLER_DIRECTORY.find((s) => s.id === id)).filter(Boolean) as typeof SELLER_DIRECTORY,
    [t.allowedSellerIds]
  );

  const sellerIcon = (type: SellerType) =>
    type === "Agent" ? UserCircle2 : type === "Bank" ? Building2 : Store;

  const showValue = t.premiumOverrideType !== "No override" && t.premiumOverrideType !== "Management approved manual premium";
  const valueLabel =
    t.premiumOverrideType === "Percentage discount" ? "Discount (%)"
    : t.premiumOverrideType === "Fixed discount" ? "Discount amount"
    : t.premiumOverrideType === "Fixed premium" ? "Flat premium amount"
    : "Value";

  const handleSave = () => {
    if (!t.name) return;
    onSave(t);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-border">
          <DialogTitle className="text-xl">{initial ? "Edit template" : "New template / package"}</DialogTitle>
          <DialogDescription>
            Bundle coverages and pricing rules into a sellable package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Identity */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="tname" className="text-xs uppercase tracking-wide text-muted-foreground">Template Name *</Label>
                <Input id="tname" value={t.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Standard, Premium" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="tdesc" className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                <Input id="tdesc" value={t.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Short marketing description for the package" />
              </div>
            </div>
          </section>

          {/* Coverages */}
          <section className="space-y-3">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Coverages</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-accent" />
                  <h5 className="text-sm font-semibold">Included coverages</h5>
                  <Badge variant="secondary" className="ml-auto text-[10px]">{t.includedCoverageIds.length}</Badge>
                </div>
                {mandatory.length === 0 && <p className="text-xs text-muted-foreground">No mandatory coverages on this version.</p>}
                <div className="space-y-1">
                  {mandatory.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent-soft/40 cursor-pointer">
                      <Checkbox checked={t.includedCoverageIds.includes(c.id)} onCheckedChange={() => toggleArr("includedCoverageIds", c.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                      </div>
                      <span className="text-[11px] font-mono text-accent shrink-0">{c.code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldPlus className="h-4 w-4 text-accent" />
                  <h5 className="text-sm font-semibold">Optional riders</h5>
                  <Badge variant="secondary" className="ml-auto text-[10px]">{t.optionalRiderIds.length}</Badge>
                </div>
                {riders.length === 0 && <p className="text-xs text-muted-foreground">No riders on this version.</p>}
                <div className="space-y-1">
                  {riders.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent-soft/40 cursor-pointer">
                      <Checkbox checked={t.optionalRiderIds.includes(c.id)} onCheckedChange={() => toggleArr("optionalRiderIds", c.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                      </div>
                      <span className="text-[11px] font-mono text-accent shrink-0">{c.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & currencies + Permissions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="space-y-3 rounded-lg border border-border bg-card p-5 lg:col-span-2">
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Pricing & currencies</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Default currency</Label>
                  <Select value={t.defaultCurrency} onValueChange={(v) => set("defaultCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {productCurrencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Allowed currencies</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {productCurrencies.map((c) => {
                      const active = t.allowedCurrencies.includes(c);
                      return (
                        <button type="button" key={c} onClick={() => toggleArr("allowedCurrencies", c)}
                          className={`px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors ${
                            active ? "bg-accent text-accent-foreground border-accent"
                            : "bg-card text-foreground border-border hover:border-accent hover:text-accent"
                          }`}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Premium override type</Label>
                  <Select value={t.premiumOverrideType} onValueChange={(v) => set("premiumOverrideType", v as PremiumOverrideType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OVERRIDES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {showValue ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="ovv">{valueLabel}</Label>
                    <Input id="ovv" type="number" step="0.01" value={t.premiumOverrideValue ?? 0}
                      onChange={(e) => set("premiumOverrideValue", +e.target.value)} className="font-mono" />
                  </div>
                ) : <div className="hidden md:block" />}

                <div className="space-y-1.5">
                  <Label htmlFor="agent-comm">Agent Commission</Label>
                  <div className="relative">
                    <Input id="agent-comm" type="number" step="0.01" min="0" max="100"
                      value={parseFloat((t.agentCommission * 100).toFixed(6)).toString()}
                      onChange={(e) => set("agentCommission", (+e.target.value || 0) / 100)}
                      className="pr-7 font-mono" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank-comm">Bank Commission</Label>
                  <div className="relative">
                    <Input id="bank-comm" type="number" step="0.01" min="0" max="100"
                      value={parseFloat((t.bankCommission * 100).toFixed(6)).toString()}
                      onChange={(e) => set("bankCommission", (+e.target.value || 0) / 100)}
                      className="pr-7 font-mono" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="block">Status</Label>
                  <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                    <span className="text-sm">{t.isActive ? "Active" : "Inactive"}</span>
                    <Switch checked={t.isActive} onCheckedChange={(v) => set("isActive", v)} />
                  </label>
                </div>
              </div>
            </section>

            {/* Permissions / Who can sell */}
            <section className="space-y-3 rounded-lg border border-border bg-card p-5 lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Permissions</h4>
                <Badge variant="secondary" className="text-[10px]">{selectedSellers.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Agents, banks or branches allowed to sell this package.
              </p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={sellerQuery}
                  onChange={(e) => setSellerQuery(e.target.value)}
                  placeholder="Search agent or bank…"
                  className="pl-8 h-9 text-sm"
                />
                {sellerQuery && sellerResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg max-h-56 overflow-y-auto">
                    {sellerResults.map((s) => {
                      const Icon = sellerIcon(s.type);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => { toggleArr("allowedSellerIds", s.id); setSellerQuery(""); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent-soft/40 transition-colors"
                        >
                          <Icon className="h-4 w-4 text-accent shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{s.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{s.code} · {s.type}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {sellerQuery && sellerResults.length === 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg p-3 text-xs text-muted-foreground">
                    No matches.
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-72 pr-1">
                {selectedSellers.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    No entities added — package is not assigned to any seller.
                  </p>
                )}
                {selectedSellers.map((s) => {
                  const Icon = sellerIcon(s.type);
                  return (
                    <div key={s.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-background">
                      <Icon className="h-4 w-4 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{s.code} · {s.type}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => toggleArr("allowedSellerIds", s.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Classification */}
          <section className="space-y-3 rounded-lg border border-border bg-card p-5">
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Classification & policy attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Type</Label>
                <Select value={t.typeCode} onValueChange={(v) => set("typeCode", v as TemplateTypeCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPE_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Policy type (Tip Police)</Label>
                <Select value={t.policyType} onValueChange={(v) => set("policyType", v as PolicyTypeCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POLICY_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Payment type</Label>
                <Select value={t.paymentType} onValueChange={(v) => set("paymentType", v as PaymentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Renewal type</Label>
                <Select value={t.renewalType} onValueChange={(v) => set("renewalType", v as RenewalType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RENEWAL_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Loan type</Label>
                <Select value={t.loanType} onValueChange={(v) => set("loanType", v as LoanType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOAN_TYPES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="block">Cancelled (Anulluar)</Label>
                <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                  <span className="text-sm">{t.cancelled ? "Yes" : "No"}</span>
                  <Switch checked={t.cancelled} onCheckedChange={(v) => set("cancelled", v)} />
                </label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity (Sasia)</Label>
                <Input id="qty" type="number" min="0" value={t.quantity}
                  onChange={(e) => set("quantity", +e.target.value || 0)} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxmonths">Max months (Max Muaj)</Label>
                <Input id="maxmonths" type="number" min="0" value={t.maxMonths}
                  onChange={(e) => set("maxMonths", +e.target.value || 0)} className="font-mono" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="printtype">Print type (Tip Printimi)</Label>
                <Input id="printtype" value={t.printType}
                  onChange={(e) => set("printType", e.target.value)} className="font-mono" />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initial ? "Save changes" : "Create template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
