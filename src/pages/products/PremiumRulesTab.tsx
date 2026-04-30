import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Calculator, Save, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { listVersions } from "@/data/productVersions";
import {
  PremiumRule, PremiumRuleType, RateRow, RateType, Gender,
  getPremiumRule, savePremiumRule, calculatePremium, newRowId,
} from "@/data/premiumRules";
import { getProduct } from "@/data/products";

type Props = { productId: string };

const RULE_TYPES: PremiumRuleType[] = [
  "Fixed premium",
  "Percentage of insured amount",
  "Age-based rate",
  "Gender-based rate",
  "Age + Gender rate table",
  "Loan balance based premium",
  "Manual premium override",
];

const RATE_TYPES: RateType[] = ["Fixed", "Per 1000 Sum Insured", "Percentage"];

const ruleHints: Record<PremiumRuleType, string> = {
  "Fixed premium": "Same flat amount for every customer.",
  "Percentage of insured amount": "Premium = sum insured × percentage.",
  "Age-based rate": "Rates vary by age band only.",
  "Gender-based rate": "Rates vary by gender only.",
  "Age + Gender rate table": "Most common life-insurance setup. Rates vary by age band and gender.",
  "Loan balance based premium": "Premium per 1000 of outstanding loan balance.",
  "Manual premium override": "Premium is entered manually by the underwriter for each offer.",
};

const usesRateTable = (t: PremiumRuleType) =>
  t === "Age-based rate" || t === "Gender-based rate" || t === "Age + Gender rate table";

const PremiumRulesTab = ({ productId }: Props) => {
  const product = getProduct(productId);
  const versions = useMemo(() => listVersions(productId), [productId]);
  const defaultVersion =
    versions.find((v) => v.status === "Active")?.id ?? versions[0]?.id ?? "";

  const [versionId, setVersionId] = useState(defaultVersion);
  const [rule, setRule] = useState<PremiumRule>(() =>
    versionId ? { ...getPremiumRule(productId, versionId) } : { productId, versionId: "", ruleType: "Fixed premium", rateTable: [] }
  );

  // Reload rule when version changes
  const switchVersion = (v: string) => {
    setVersionId(v);
    setRule({ ...getPremiumRule(productId, v) });
  };

  const setField = <K extends keyof PremiumRule>(k: K, v: PremiumRule[K]) =>
    setRule((r) => ({ ...r, [k]: v }));

  const updateRow = (id: string, patch: Partial<RateRow>) =>
    setRule((r) => ({ ...r, rateTable: r.rateTable.map((row) => (row.id === id ? { ...row, ...patch } : row)) }));

  const addRow = () =>
    setRule((r) => ({
      ...r,
      rateTable: [
        ...r.rateTable,
        { id: newRowId(), ageFrom: 18, ageTo: 35, gender: "Male", rate: 1, rateType: "Per 1000 Sum Insured" },
      ],
    }));

  const removeRow = (id: string) =>
    setRule((r) => ({ ...r, rateTable: r.rateTable.filter((row) => row.id !== id) }));

  const handleSave = () => {
    savePremiumRule(rule);
    toast.success("Premium rule saved");
  };

  // Preview state
  const currencies = product?.currencies ?? ["EUR"];
  const [preview, setPreview] = useState({
    age: 35,
    gender: "Male" as Gender,
    sumInsured: 50000,
    currency: currencies[0] ?? "EUR",
    loanBalance: 50000,
    termYears: 10,
  });

  // Per-year premiums across the term (customer ages each year)
  const yearly = useMemo(() => {
    const years = Math.max(1, Math.floor(preview.termYears || 1));
    return Array.from({ length: years }, (_, i) => {
      const ageAtYear = preview.age + i;
      return calculatePremium(rule, {
        age: ageAtYear,
        gender: preview.gender,
        sumInsured: preview.sumInsured,
        currency: preview.currency,
        loanBalance: preview.loanBalance,
      });
    });
  }, [rule, preview]);

  // First-year result drives the headline & rate-row highlight
  const result = yearly[0] ?? { amount: 0, explanation: "" };
  const totalOverTerm = yearly.reduce((s, y) => s + y.amount, 0);
  const avgAnnual = totalOverTerm / yearly.length;
  const lastYear = yearly[yearly.length - 1];

  if (versions.length === 0) {
    return (
      <Card className="p-10 text-center shadow-card border-border border-dashed">
        <p className="text-sm text-muted-foreground">
          Create a product version first to define premium rules.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Version</span>
          <Select value={versionId} onValueChange={switchVersion}>
            <SelectTrigger className="w-[280px] h-9">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="font-mono text-xs text-accent mr-2">{v.number}</span>
                  {v.name} <span className="ml-2 text-xs text-muted-foreground">· {v.status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Save className="h-4 w-4" /> Save Premium Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Rule configuration */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Rule type</h3>
            <p className="text-xs text-muted-foreground mb-4">Choose how the premium is calculated for this version.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Premium rule</Label>
                <Select value={rule.ruleType} onValueChange={(v) => setField("ruleType", v as PremiumRuleType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent-soft/40 rounded-md p-3">
                <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>{ruleHints[rule.ruleType]}</span>
              </div>
            </div>

            {/* Conditional fields */}
            {rule.ruleType === "Fixed premium" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="space-y-1.5">
                  <Label>Fixed amount (€)</Label>
                  <Input type="number" step="0.01" value={rule.fixedAmount ?? 0}
                    onChange={(e) => setField("fixedAmount", +e.target.value)} />
                </div>
              </div>
            )}
            {rule.ruleType === "Percentage of insured amount" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="space-y-1.5">
                  <Label>Percentage (%)</Label>
                  <Input type="number" step="0.01" value={rule.percentage ?? 0}
                    onChange={(e) => setField("percentage", +e.target.value)} />
                </div>
              </div>
            )}
            {rule.ruleType === "Loan balance based premium" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="space-y-1.5">
                  <Label>Rate per 1000 of loan balance</Label>
                  <Input type="number" step="0.01" value={rule.loanRatePer1000 ?? 0}
                    onChange={(e) => setField("loanRatePer1000", +e.target.value)} />
                </div>
              </div>
            )}
            {rule.ruleType === "Manual premium override" && (
              <p className="text-xs text-muted-foreground mt-5 italic">
                No configuration required. Underwriters will set the premium manually on each offer.
              </p>
            )}
          </Card>

          {/* Rate table editor */}
          {usesRateTable(rule.ruleType) && (
            <Card className="shadow-card border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Rate table</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add rows for each age band and gender combination.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addRow} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Row
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-24">Age From</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-24">Age To</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-36">Gender</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-32">Rate</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Rate Type</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rule.rateTable.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                        No rows yet. Click <span className="font-medium text-foreground">Add Row</span> to start.
                      </TableCell>
                    </TableRow>
                  )}
                  {rule.rateTable.map((row) => {
                    const isHighlighted = result.matched?.id === row.id;
                    return (
                      <TableRow
                        key={row.id}
                        className={isHighlighted ? "bg-accent-soft/60 hover:bg-accent-soft/60" : "hover:bg-accent-soft/30"}
                      >
                        <TableCell>
                          <Input type="number" className="h-8" value={row.ageFrom}
                            onChange={(e) => updateRow(row.id, { ageFrom: +e.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="h-8" value={row.ageTo}
                            onChange={(e) => updateRow(row.id, { ageTo: +e.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Select value={row.gender} onValueChange={(v) => updateRow(row.id, { gender: v as Gender })}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Any">Any</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" className="h-8 font-mono" value={row.rate}
                            onChange={(e) => updateRow(row.id, { rate: +e.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Select value={row.rateType} onValueChange={(v) => updateRow(row.id, { rateType: v as RateType })}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {RATE_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeRow(row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Preview card */}
        <Card className="p-6 shadow-card border-border h-fit xl:sticky xl:top-32">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-md bg-gradient-accent text-accent-foreground flex items-center justify-center">
              <Calculator className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Premium Calculation Preview</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Live calculation using the unsaved rule above.</p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pv-age">Age</Label>
                <Input id="pv-age" type="number" value={preview.age}
                  onChange={(e) => setPreview((p) => ({ ...p, age: +e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={preview.gender} onValueChange={(v) => setPreview((p) => ({ ...p, gender: v as Gender }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pv-sum">Sum Insured</Label>
                <Input id="pv-sum" type="number" value={preview.sumInsured}
                  onChange={(e) => setPreview((p) => ({ ...p, sumInsured: +e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pv-term">Term (years)</Label>
                <Input id="pv-term" type="number" min={1} max={50} value={preview.termYears}
                  onChange={(e) => setPreview((p) => ({ ...p, termYears: +e.target.value }))} />
              </div>
            </div>
            {rule.ruleType === "Loan balance based premium" && (
              <div className="space-y-1.5">
                <Label htmlFor="pv-loan">Loan balance</Label>
                <Input id="pv-loan" type="number" value={preview.loanBalance}
                  onChange={(e) => setPreview((p) => ({ ...p, loanBalance: +e.target.value }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={preview.currency} onValueChange={(v) => setPreview((p) => ({ ...p, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result */}
          <div className="mt-5 rounded-md p-4 bg-gradient-topbar text-topbar-foreground">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-topbar-muted font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Calculated Premium
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-semibold tracking-tight">
                {result.amount > 0
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: preview.currency, maximumFractionDigits: 2 }).format(result.amount)
                  : "—"}
              </div>
              <Badge className="bg-accent text-accent-foreground border-0">/ year</Badge>
            </div>
            <div className="mt-1 text-xs text-topbar-muted">
              ≈ {(result.amount / 12).toFixed(2)} {preview.currency} / month
            </div>
            <p className="mt-3 text-xs text-topbar-muted leading-relaxed border-t border-topbar-border pt-3">
              {result.explanation}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PremiumRulesTab;
