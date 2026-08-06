import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Calculator,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { listCoverages, Coverage } from "@/data/coverages";
import { getPremiumRule, calculatePremium, Gender } from "@/data/premiumRules";
import { listTemplates, Template } from "@/data/templates";
import { getRatesForPair, convert } from "@/data/fxRates";
import type { PaymentMode } from "@/data/offers";

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
  status: "Not Due" | "Current Year" | "Past" | "Not Billed";
  note?: string;
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
  paymentMode?: PaymentMode;
  loan?: {
    amount: number;
    interestRate: number;
    loanTermYears: number;
    remainingYears?: number;
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
  paymentMode = "Pagesa me prim te rregullt",
  loan,
  onResultChange,
}: Props) => {
  // Version is optional for now — treat placeholder / empty as unset.
  const effectiveVersionId = versionId && versionId !== "N/A" ? versionId : undefined;
  const template: Template | undefined = effectiveVersionId
    ? listTemplates(productId, effectiveVersionId).find((t) => t.id === templateId)
    : undefined;
  const coverages = useMemo(
    () => listCoverages(productId, effectiveVersionId),
    [productId, effectiveVersionId]
  );

  const mandatory = coverages.filter(
    (c) =>
      c.coverageType === "Mandatory" &&
      (!template || template.includedCoverageIds.includes(c.id))
  );
  const allRiders = coverages.filter(
    (c) =>
      c.coverageType === "Optional Rider" &&
      (!template || template.optionalRiderIds.includes(c.id))
  );

  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualReason, setManualReason] = useState("");

  // FX
  const baseCurrency = "EUR";
  const fxCandidates = currency === baseCurrency ? [] : getRatesForPair(baseCurrency, currency);
  const [fxOverrideId, setFxOverrideId] = useState<string>("auto");

  // Reset override when offer currency changes so we don't keep a stale pair id.
  useEffect(() => {
    setFxOverrideId("auto");
  }, [currency]);

  const fxOverrideRate =
    fxOverrideId === "auto" ? undefined : fxCandidates.find((c) => c.id === fxOverrideId)?.rate;
  const fxConv = convert(1, baseCurrency, currency, fxOverrideRate);

  // ---- Premium calculation ----
  const loanBalance = loan?.outstandingBalance;

  let mandatoryTotal = 0;
  let weightedCommission = 0;
  mandatory.forEach((c) => {
    const { amount } = coveragePremium(c, insuredAge, insuredGender, currency, loanBalance);
    mandatoryTotal += amount;
    weightedCommission += (amount * c.commissionPct) / 100;
  });

  let ridersTotal = 0;
  selectedRiders.forEach((id) => {
    const c = allRiders.find((r) => r.id === id);
    if (!c) return;
    const { amount } = coveragePremium(c, insuredAge, insuredGender, currency, loanBalance);
    ridersTotal += amount;
    weightedCommission += (amount * c.commissionPct) / 100;
  });

  const subtotal = mandatoryTotal + ridersTotal;

  const baseRule = getPremiumRule(productId, effectiveVersionId ?? "N/A");
  const ruleHit =
    baseRule.rateTable.find(
      (r) => insuredAge >= r.ageFrom && insuredAge <= r.ageTo && (r.gender === "Any" || r.gender === insuredGender)
    ) ?? null;

  let templateAdjustment = 0;
  if (template) {
    switch (template.premiumOverrideType) {
      case "Fixed discount":
        templateAdjustment = -(template.premiumOverrideValue ?? 0);
        break;
      case "Percentage discount":
        templateAdjustment = -((subtotal * (template.premiumOverrideValue ?? 0)) / 100);
        break;
      case "Fixed premium":
        templateAdjustment = (template.premiumOverrideValue ?? 0) - subtotal;
        break;
      default:
        break;
    }
  }

  const calculatedNet = Math.max(0, subtotal + templateAdjustment);

  let netPremium = calculatedNet;
  if (manualOverride && manualAmount !== "") {
    netPremium = Math.max(0, Number(manualAmount));
  }

  const TAX_RATE = 0.10;
  const tax = netPremium * TAX_RATE;
  const grossPremium = netPremium + tax;

  const effectiveCommissionPct =
    template ? (template.agentCommission + template.bankCommission) * 100 : (subtotal > 0 ? (weightedCommission / subtotal) * 100 : 0);
  const commission = (netPremium * effectiveCommissionPct) / 100;

  // ---- Multi-year schedule (row count = Loan Term when a loan is present) ----
  const schedule: ScheduleRow[] = [];
  const start = startDate ? new Date(startDate) : new Date();
  const currentYearNum = new Date().getFullYear();
  const termN = Math.max(
    1,
    loan && loan.loanTermYears > 0 ? Math.floor(loan.loanTermYears) : termYears,
  );

  const amort: number[] = [];
  if (loan) {
    const principal = Math.max(0, loan.outstandingBalance || loan.amount || 0);
    for (let i = 0; i < termN; i++) {
      amort.push(Math.round(((principal * (termN - i)) / termN) * 100) / 100);
    }
  }

  const premiumForYear = (i: number): { net: number; note?: string } => {
    switch (paymentMode) {
      case "Pagese per gjithe periudhen (Upfront)":
        return i === 0
          ? { net: netPremium * termN, note: `Upfront × ${termN} yrs` }
          : { net: 0, note: "Covered by upfront payment" };
      case "Pagesa me tarife te vetme për të gjithë periudhën":
        return i === 0
          ? { net: netPremium, note: "Single fee for entire period" }
          : { net: 0, note: "No further charges" };
      case "Pagesa me prim fiks mujor": {
        const monthly = netPremium / 12;
        return { net: monthly * 12, note: `12 × ${fmt(monthly, currency)}/mo` };
      }
      case "Pagesa me prim fiks vjetor":
        return { net: netPremium, note: "Fixed annual premium" };
      case "Pagesa me prim te paracaktuar, kjo eshte e velfshme per sigurimin e jetes se kombinuar Protect, Sigurimi i jetes se kombinuar ISP": {
        const factor = 1.25 - (0.5 * i) / Math.max(1, termN - 1);
        return { net: netPremium * factor, note: `Predetermined factor ×${factor.toFixed(2)}` };
      }
      case "Pagesa me prim te rregullt":
      default: {
        if (loan && amort.length > 0 && amort[0] > 0) {
          const factor = amort[i] / amort[0];
          return {
            net: netPremium * factor,
            note: `Tracks loan balance (${(factor * 100).toFixed(0)}%)`,
          };
        }
        return { net: netPremium, note: "Regular annual premium" };
      }
    }
  };

  for (let y = 1; y <= termN; y++) {
    const ys = new Date(start);
    ys.setFullYear(start.getFullYear() + (y - 1));
    const ye = new Date(start);
    ye.setFullYear(start.getFullYear() + y);

    const { net: yearNet, note } = premiumForYear(y - 1);
    const yearTax = yearNet * TAX_RATE;
    const yearGross = yearNet + yearTax;
    const yearComm = (yearNet * effectiveCommissionPct) / 100;

    const yLabel = ys.getFullYear();
    let status: ScheduleRow["status"] = "Not Due";
    if (yearGross === 0) status = "Not Billed";
    else if (yLabel === currentYearNum) status = "Current Year";
    else if (yLabel < currentYearNum) status = "Past";

    schedule.push({
      year: y,
      startDate: ys.toISOString().slice(0, 10),
      endDate: ye.toISOString().slice(0, 10),
      estimatedLoanBalance: loan ? amort[y - 1] ?? 0 : undefined,
      premium: yearNet,
      tax: yearTax,
      commission: yearComm,
      gross: yearGross,
      status,
      note,
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
  }, [
    netPremium,
    tax,
    commission,
    grossPremium,
    fxConv.rate,
    manualOverride,
    manualAmount,
    manualReason,
    termN,
    loan?.loanTermYears,
    loan?.outstandingBalance,
    loan?.amount,
    paymentMode,
  ]);

  const toggleRider = (id: string) => {
    setSelectedRiders((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!productId || !currency) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Select a product and currency in the previous steps to compute the premium.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
          <div><div className="text-[11px] uppercase text-muted-foreground">Term</div><div className="font-medium">{termN} years</div></div>
          {loan && (
            <>
              <div><div className="text-[11px] uppercase text-muted-foreground">Loan Outstanding</div><div className="font-medium">{fmt(loan.outstandingBalance, currency)}</div></div>
              <div><div className="text-[11px] uppercase text-muted-foreground">Mortgage Rate</div><div className="font-medium">{loan.interestRate}%</div></div>
            </>
          )}
          {ruleHit && (
            <div className="col-span-2 md:col-span-4 text-[11px] text-muted-foreground bg-muted/40 rounded px-3 py-2">
              Age/Gender rule matched: <strong>Age {ruleHit.ageFrom}-{ruleHit.ageTo}, {ruleHit.gender}</strong> @ {ruleHit.rate} {ruleHit.rateType}
            </div>
          )}
        </CardContent>
      </Card>

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
              {currency === baseCurrency
                ? "1.0000"
                : isFinite(fxConv.rate)
                  ? fxConv.rate.toFixed(4)
                  : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {currency === baseCurrency
                ? "Same currency"
                : fxConv.source === "missing"
                  ? "No rate for this pair"
                  : fxConv.source}
            </div>
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
              <div className="flex items-center gap-2 text-xs rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 " />
                <div className="mt-0.5">
                  <strong>Requires approval: Yes.</strong> This offer will be routed to management for sign-off
                  before it can be issued.
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PremiumCalculation;
