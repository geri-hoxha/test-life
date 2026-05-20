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
  Template, PremiumOverrideType, newTemplateId,
} from "@/data/templates";
import { listCoverages } from "@/data/coverages";
import { Shield, ShieldPlus } from "lucide-react";

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
  isActive: true,
});

const OVERRIDES: PremiumOverrideType[] = [
  "No override",
  "Fixed discount",
  "Percentage discount",
  "Fixed premium",
  "Management approved manual premium",
];

const TemplateDialog = ({ open, onOpenChange, productId, versionId, productCurrencies, initial, onSave }: Props) => {
  const [t, setT] = useState<Template>(initial ?? blank(productId, versionId, productCurrencies));

  useEffect(() => {
    setT(initial ?? blank(productId, versionId, productCurrencies));
  }, [initial, productId, versionId, productCurrencies, open]);

  const set = <K extends keyof Template>(k: K, v: Template[K]) => setT((s) => ({ ...s, [k]: v }));

  const allCoverages = useMemo(() => listCoverages(productId, versionId), [productId, versionId]);
  const mandatory = allCoverages.filter((c) => c.coverageType === "Mandatory");
  const riders = allCoverages.filter((c) => c.coverageType === "Optional Rider");

  const toggleArr = (key: "includedCoverageIds" | "optionalRiderIds" | "allowedCurrencies", val: string) =>
    setT((s) => ({
      ...s,
      [key]: s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val],
    }));

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit template" : "New template / package"}</DialogTitle>
          <DialogDescription>
            Bundle coverages and pricing rules into a sellable package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="tname">Template Name *</Label>
              <Input id="tname" value={t.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Standard, Premium, Bank Loan Protection" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="tdesc">Description</Label>
              <Textarea id="tdesc" rows={2} value={t.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Short marketing description for the package" />
            </div>
          </div>

          {/* Coverages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-accent" />
                <h4 className="text-sm font-semibold">Included coverages</h4>
              </div>
              {mandatory.length === 0 && <p className="text-xs text-muted-foreground">No mandatory coverages on this version.</p>}
              <div className="space-y-2">
                {mandatory.map((c) => (
                  <label key={c.id} className="flex items-start gap-2 p-2 rounded hover:bg-accent-soft/40 cursor-pointer">
                    <Checkbox
                      checked={t.includedCoverageIds.includes(c.id)}
                      onCheckedChange={() => toggleArr("includedCoverageIds", c.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[11px] font-mono text-accent">{c.code}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldPlus className="h-4 w-4 text-accent" />
                <h4 className="text-sm font-semibold">Optional riders</h4>
              </div>
              {riders.length === 0 && <p className="text-xs text-muted-foreground">No riders on this version.</p>}
              <div className="space-y-2">
                {riders.map((c) => (
                  <label key={c.id} className="flex items-start gap-2 p-2 rounded hover:bg-accent-soft/40 cursor-pointer">
                    <Checkbox
                      checked={t.optionalRiderIds.includes(c.id)}
                      onCheckedChange={() => toggleArr("optionalRiderIds", c.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[11px] font-mono text-accent">{c.code}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Currencies */}
          <div className="rounded-md border border-border p-4">
            <h4 className="text-sm font-semibold mb-3">Currencies</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Default currency</Label>
                <Select value={t.defaultCurrency} onValueChange={(v) => set("defaultCurrency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {productCurrencies.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Allowed currencies</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {productCurrencies.map((c) => {
                    const active = t.allowedCurrencies.includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleArr("allowedCurrencies", c)}
                        className={`px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors ${
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
              </div>
            </div>
          </div>

          {/* Premium override */}
          <div className="rounded-md border border-border p-4">
            <h4 className="text-sm font-semibold mb-3">Premium override</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Premium override type</Label>
                <Select value={t.premiumOverrideType} onValueChange={(v) => set("premiumOverrideType", v as PremiumOverrideType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OVERRIDES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="block">Status</Label>
                <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                  <span className="text-sm">{t.isActive ? "Active" : "Inactive"}</span>
                  <Switch checked={t.isActive} onCheckedChange={(v) => set("isActive", v)} />
                </label>
              </div>
              {showValue && (
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="ovv">{valueLabel}</Label>
                  <Input id="ovv" type="number" step="0.01" value={t.premiumOverrideValue ?? 0}
                    onChange={(e) => set("premiumOverrideValue", +e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="agent-comm">Agent Commission (%)</Label>
                <div className="relative">
                  <Input id="agent-comm" type="number" step="0.01" min="0" max="100"
                    value={parseFloat((t.agentCommission * 100).toFixed(6)).toString()}
                    onChange={(e) => set("agentCommission", (+e.target.value || 0) / 100)}
                    className="pr-7 font-mono" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank-comm">Bank Commission (%)</Label>
                <div className="relative">
                  <Input id="bank-comm" type="number" step="0.01" min="0" max="100"
                    value={(t.bankCommission * 100).toString()}
                    onChange={(e) => set("bankCommission", (+e.target.value || 0) / 100)}
                    className="pr-7 font-mono" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
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
