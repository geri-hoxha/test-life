import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Calculator,
  AlertTriangle,
  ArrowRight,
  Plus,
  Minus,
  Equal,
  ShieldAlert,
} from "lucide-react";
import { listCoverages, Coverage } from "@/data/coverages";
import { getPremiumRule, calculatePremium, Gender } from "@/data/premiumRules";
import { listTemplates, Template } from "@/data/templates";
import { getRatesForPair, convert } from "@/data/fxRates";

export type PremiumResult = {
  netPremium: number;
  taxRate: number;
  tax: number;
  commission: number;
  grossPremium: number;
  fxRate: number;
  fxSource: string;
  manualOverride?: { amount: number; reason: string };
  schedule: ScheduleRow[];
};

export type ScheduleRow = {
  year: number;
  startDate: string;
  endDate: string;
  estimatedLoanBalance?: number;
  premium: number;
  tax: number;
  commission: number;
  gross: number;
  status: "Not Due" | "Current Year";
};

type Props = {
  productId: string;
  versionId: string;
  templateId: string;
  currency: string;
  insuredAge: number;
  insuredGender: Gender;
  startDate: string;
  termYears: number;
  loan?: {
    amount: number;
    interestRate: number;
    loanTermYears: number;
    remainingYears: number;
    outstandingBalance: number;
  };
  onResultChange?: (r: PremiumResult) => void;
};

const fmt = (v: number, ccy: string) =>
  isFinite(v)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v)
    : "—";

/** Premium for a single coverage (in offer currency). */
const coveragePremium = (
  c: Coverage,
  age: number,
  gender: Gender,
  currency: string,
  loanBalance?: number
): { amount: number; basis: string } => {
  const sumInsured =
    c.sumInsuredType === "Based on loan amount" ? loanBalance ?? c.defaultSumInsured : c.defaultSumInsured;

  switch (c.basePremiumType) {
    case "Fixed amount":
      return { amount: c.basePremiumValue, basis: `Fixed ${fmt(c.basePremiumValue, currency)}` };
    case "Percentage of insured amount": {
      const amt = (sumInsured * c.basePremiumValue) / 100;
      return { amount: amt, basis: `${c.basePremiumValue}% × ${fmt(sumInsured, currency)}` };
    }
    case "Rate table by age/gender": {
      const rule = getPremiumRule(c.productId, c.versionId);
      const r = calculatePremium(rule, { age, gender, sumInsured, currency, loanBalance });
      return { amount: r.amount, basis: r.explanation };
    }
  }
};

const PremiumCalculation = ({
  productId,
  versionId,
  templateId,
  currency,
  insuredAge,
  insuredGender,
  startDate,
  termYears,
  loan,
  onResultChange,
}: Props) => {
  const template: Template | undefined = listTemplates(productId, versionId).find((t) => t.id === templateId);
  const coverages = useMemo(() => listCoverages(productId, versionId), [productId, versionId]);

  const mandatory = coverages.filter(
    (c) => c.coverageType === "Mandatory" && template?.includedCoverageIds.includes(c.id)
  );
  const allRiders = coverages.filter(
    (c) => c.coverageType === "Optional Rider" && template?.optionalRiderIds.includes(c.id)
  );

  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualReason, setManualReason] = useState("");

  // FX
  const baseCurrency = "EUR";
  const fxCandidates = currency === baseCurrency ? [] : getRatesForPair(baseCurrency, currency);
  const [fxOverrideId, setFxOverrideId] = useState<string>("auto");
  const fxOverrideRate =
    fxOverrideId === "auto" ? undefined : fxCandidates.find((c) => c.id === fxOverrideId)?.rate;
  const fxConv = convert(1, baseCurrency, currency, fxOverrideRate);

  // ---- Step-by-step calculation ----
  const lines: { label: string; basis: string; amount: number; sign: "+" | "-" | "="; muted?: boolean }[] = [];

  const loanBalance = loan?.outstandingBalance;

  // 1. Mandatory base premium
  let mandatoryTotal = 0;
  let weightedCommission = 0;
  mandatory.forEach((c) => {
    const { amount, basis } = coveragePremium(c, insuredAge, insuredGender, currency, loanBalance);
    mandatoryTotal += amount;
    weightedCommission += (amount * c.commissionPct) / 100;
    lines.push({ label: `Mandatory · ${c.name}`, basis, amount, sign: "+" });
  });

  // 2. Riders
  let ridersTotal = 0;
  selectedRiders.forEach((id) => {
    const c = allRiders.find((r) => r.id === id);
    if (!c) return;
    const { amount, basis } = coveragePremium(c, insuredAge, insuredGender, currency, loanBalance);
    ridersTotal += amount;
    weightedCommission += (amount * c.commissionPct) / 100;
    lines.push({ label: `Rider · ${c.name}`, basis, amount, sign: "+" });
  });

  let subtotal = mandatoryTotal + ridersTotal;

  // Reference: age/gender rule applied (informational)
  const baseRule = getPremiumRule(productId, versionId);
  const ruleHit =
    baseRule.rateTable.find(
      (r) => insuredAge >= r.ageFrom && insuredAge <= r.ageTo && (r.gender === "Any" || r.gender === insuredGender)
    ) ?? null;

  // 3. Loan balance adjustment (if any mandatory uses loan and loan is shrinking)
  let loanAdjustment = 0;
  const usesLoan = mandatory.some((c) => c.sumInsuredType === "Based on loan amount");
  if (usesLoan && loan && loan.amount > loan.outstandingBalance) {
    // already reflected in subtotal via balance, log informationally
    lines.push({
      label: "Loan balance adjustment",
      basis: `Premium based on outstanding ${fmt(loan.outstandingBalance, currency)} (vs original ${fmt(loan.amount, currency)})`,
      amount: 0,
      sign: "=",
      muted: true,
    });
  }

  // 4. Template discount/override
  let templateAdjustment = 0;
  let templateLabel = "";
  if (template) {
    switch (template.premiumOverrideType) {
      case "Fixed discount":
        templateAdjustment = -(template.premiumOverrideValue ?? 0);
        templateLabel = `Fixed discount of ${fmt(template.premiumOverrideValue ?? 0, currency)}`;
        break;
      case "Percentage discount":
        templateAdjustment = -((subtotal * (template.premiumOverrideValue ?? 0)) / 100);
        templateLabel = `${template.premiumOverrideValue}% off subtotal`;
        break;
      case "Fixed premium":
        templateAdjustment = (template.premiumOverrideValue ?? 0) - subtotal;
        templateLabel = `Flat premium ${fmt(template.premiumOverrideValue ?? 0, currency)} replaces calculated`;
        break;
      case "Management approved manual premium":
        templateLabel = "Manual premium pending — see override below.";
        break;
      default:
        templateLabel = "No template override applied.";
    }
    if (templateAdjustment !== 0) {
      lines.push({
        label: `Template · ${template.name}`,
        basis: templateLabel,
        amount: templateAdjustment,
        sign: templateAdjustment < 0 ? "-" : "+",
      });
    } else {
      lines.push({ label: `Template · ${template.name}`, basis: templateLabel, amount: 0, sign: "=", muted: true });
    }
  }

  let calculatedNet = Math.max(0, subtotal + templateAdjustment + loanAdjustment);

  // 5. Manual override
  let netPremium = calculatedNet;
  if (manualOverride && manualAmount !== "") {
    netPremium = Math.max(0, Number(manualAmount));
    lines.push({
      label: "Manual premium override",
      basis: manualReason ? `Reason: ${manualReason}` : "No reason provided",
      amount: netPremium - calculatedNet,
      sign: netPremium >= calculatedNet ? "+" : "-",
    });
  }

  // 6. Tax (10% on net) — gross is net + tax
  const TAX_RATE = 0.10;
  const tax = netPremium * TAX_RATE;
  const grossPremium = netPremium + tax;

  // 7. Commission — paid to the agent, calculated on the NET premium.
  //    Not added to gross; it's a cost to the insurer, not a charge to the customer.
  const effectiveCommissionPct =
    template?.commissionOverridePct ?? (subtotal > 0 ? (weightedCommission / subtotal) * 100 : 0);
  const commission = (netPremium * effectiveCommissionPct) / 100;

  // ---- Multi-year schedule ----
  const schedule: ScheduleRow[] = [];
  const start = startDate ? new Date(startDate) : new Date();
  for (let y = 1; y <= Math.max(1, termYears); y++) {
    const ys = new Date(start);
    ys.setFullYear(start.getFullYear() + (y - 1));
    const ye = new Date(start);
    ye.setFullYear(start.getFullYear() + y);

    let estLoanBal: number | undefined;
    if (loan) {
      const r = (loan.interestRate ?? 0) / 100;
      const remaining = Math.max(0, (loan.remainingYears ?? loan.loanTermYears) - (y - 1));
      // Simple amortisation approximation: linear reduction toward 0 by remaining term
      estLoanBal = Math.max(
        0,
        loan.outstandingBalance * Math.max(0, (remaining - 1) / Math.max(1, loan.remainingYears ?? loan.loanTermYears))
      );
      // Add interest accrual factor for realism
      estLoanBal = estLoanBal * (1 + r * 0.1);
    }

    schedule.push({
      year: y,
      startDate: ys.toISOString().slice(0, 10),
      endDate: ye.toISOString().slice(0, 10),
      estimatedLoanBalance: estLoanBal,
      premium: netPremium,
      tax,
      commission,
      gross: grossPremium,
      status: y === 1 ? "Current Year" : "Not Due",
    });
  }

  // Notify parent
  useEffect(() => {
    onResultChange?.({
      netPremium,
      taxRate: TAX_RATE,
      tax,
      commission,
      grossPremium,
      fxRate: fxConv.rate,
      fxSource: String(fxConv.source),
      manualOverride: manualOverride && manualAmount !== "" ? { amount: Number(manualAmount), reason: manualReason } : undefined,
      schedule,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netPremium, tax, commission, grossPremium, fxConv.rate, manualOverride, manualAmount, manualReason]);

  const toggleRider = (id: string) => {
    setSelectedRiders((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!template) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Select a product, version and template in the previous steps to compute the premium.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inputs summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Calculation Inputs
          </CardTitle>
          <CardDescription>Values driving the calculation. Adjust riders, manual override, and FX below.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-[11px] uppercase text-muted-foreground">Insured Age</div><div className="font-medium">{insuredAge}</div></div>
          <div><div className="text-[11px] uppercase text-muted-foreground">Gender</div><div className="font-medium">{insuredGender}</div></div>
          <div><div className="text-[11px] uppercase text-muted-foreground">Currency</div><div className="font-medium">{currency}</div></div>
          <div><div className="text-[11px] uppercase text-muted-foreground">Term</div><div className="font-medium">{termYears} years</div></div>
          {loan && (
            <>
              <div><div className="text-[11px] uppercase text-muted-foreground">Loan Outstanding</div><div className="font-medium">{fmt(loan.outstandingBalance, currency)}</div></div>
              <div><div className="text-[11px] uppercase text-muted-foreground">Mortgage Rate</div><div className="font-medium">{loan.interestRate}%</div></div>
              <div><div className="text-[11px] uppercase text-muted-foreground">Remaining Loan Yrs</div><div className="font-medium">{loan.remainingYears}</div></div>
            </>
          )}
          {ruleHit && (
            <div className="col-span-2 md:col-span-4 text-[11px] text-muted-foreground bg-muted/40 rounded px-3 py-2">
              Age/Gender rule matched: <strong>Age {ruleHit.ageFrom}-{ruleHit.ageTo}, {ruleHit.gender}</strong> @ {ruleHit.rate} {ruleHit.rateType}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riders */}
      {allRiders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optional Riders</CardTitle>
            <CardDescription>Select riders to include from the package.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {allRiders.map((r) => {
              const active = selectedRiders.includes(r.id);
              const { amount, basis } = coveragePremium(r, insuredAge, insuredGender, currency, loanBalance);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRider(r.id)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    active ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{r.name}</div>
                    <Badge variant={active ? "default" : "outline"}>{active ? "Included" : "Add"}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{basis}</div>
                  <div className="text-sm font-semibold mt-1">{fmt(amount, currency)}</div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calculation Breakdown</CardTitle>
          <CardDescription>Step-by-step composition of the net premium.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border divide-y">
            {lines.map((l, i) => (
              <div key={i} className={`flex items-start justify-between gap-3 px-3 py-2.5 ${l.muted ? "bg-muted/30" : ""}`}>
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    {l.sign === "+" ? <Plus className="h-3 w-3" /> : l.sign === "-" ? <Minus className="h-3 w-3" /> : <Equal className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{l.label}</div>
                    <div className="text-[11px] text-muted-foreground">{l.basis}</div>
                  </div>
                </div>
                <div className={`font-mono text-sm ${l.amount < 0 ? "text-destructive" : ""}`}>
                  {l.amount === 0 ? "—" : (l.amount > 0 ? "+" : "") + fmt(l.amount, currency)}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
              <div className="text-sm font-semibold">Net Premium</div>
              <div className="font-mono text-sm font-semibold">{fmt(netPremium, currency)}</div>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <div>
                <div className="text-sm">Insurance tax (10%)</div>
                <div className="text-[11px] text-muted-foreground">Statutory tax applied on top of the net premium.</div>
              </div>
              <div className="font-mono text-sm">+ {fmt(tax, currency)}</div>
            </div>
            <div className="flex items-center justify-between px-3 py-3 bg-primary/5">
              <div className="text-sm font-semibold">Gross Premium</div>
              <div className="font-mono text-base font-bold">{fmt(grossPremium, currency)}</div>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-amber-500/5">
              <div>
                <div className="text-sm">Agent commission ({effectiveCommissionPct.toFixed(1)}% of net)</div>
                <div className="text-[11px] text-muted-foreground">
                  Paid to the distributing agent. Not charged to the customer — does not affect Gross.
                </div>
              </div>
              <div className="font-mono text-sm">{fmt(commission, currency)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result cards + FX */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardHeader className="pb-1.5"><CardDescription>Net Premium</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{fmt(netPremium, currency)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Tax (10%)</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{fmt(tax, currency)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Gross Premium</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold text-primary">{fmt(grossPremium, currency)}</div></CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Agent Commission</CardDescription></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{fmt(commission, currency)}</div>
            <div className="text-[10px] text-muted-foreground">{effectiveCommissionPct.toFixed(1)}% of net</div>
          </CardContent></Card>
        <Card><CardHeader className="pb-1.5"><CardDescription>Currency</CardDescription></CardHeader>
          <CardContent><div className="text-lg font-semibold">{currency}</div></CardContent></Card>
        <Card>
          <CardHeader className="pb-1.5"><CardDescription>FX Rate (EUR→{currency})</CardDescription></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold font-mono">
              {currency === baseCurrency ? "n/a" : isFinite(fxConv.rate) ? fxConv.rate.toFixed(4) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">{fxConv.source}</div>
          </CardContent>
        </Card>
      </div>

      {currency !== baseCurrency && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FX Rate Source</CardTitle>
            <CardDescription>Defaults to the latest rate. Choose a historic entry to apply a manual override.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={fxOverrideId} onValueChange={setFxOverrideId}>
              <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Latest available rate (default)</SelectItem>
                {fxCandidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.date} · {c.rate} · {c.source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Manual override */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Edit Premium Manually
              </CardTitle>
              <CardDescription>Manual overrides require management approval before issuance.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="manual-toggle" className="text-xs text-muted-foreground">Enable</Label>
              <Switch id="manual-toggle" checked={manualOverride} onCheckedChange={setManualOverride} />
            </div>
          </div>
        </CardHeader>
        {manualOverride && (
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Manual Premium Amount ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={netPremium.toFixed(2)}
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason for Override</Label>
              <Input
                placeholder="e.g. Strategic corporate client, retention adjustment"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-start gap-2 text-xs rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Requires approval: Yes.</strong> This offer will be routed to management for sign-off
                  before it can be issued.
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Multi-year schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4" /> Multi-Year Schedule
          </CardTitle>
          <CardDescription>
            Estimated premium and (if applicable) loan balance for each policy year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  {loan && <TableHead className="text-right">Est. Loan Balance</TableHead>}
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Gross Premium</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((s) => (
                  <TableRow key={s.year}>
                    <TableCell className="font-mono">{s.year}</TableCell>
                    <TableCell className="font-mono text-xs">{s.startDate}</TableCell>
                    <TableCell className="font-mono text-xs">{s.endDate}</TableCell>
                    {loan && (
                      <TableCell className="text-right font-mono text-sm">
                        {s.estimatedLoanBalance !== undefined ? fmt(s.estimatedLoanBalance, currency) : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono text-sm">{fmt(s.premium, currency)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(s.commission, currency)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{fmt(s.gross, currency)}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Current Year" ? "default" : "secondary"}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumCalculation;
