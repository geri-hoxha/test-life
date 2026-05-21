import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calculator, Coins, CalendarRange, Info, ArrowRight } from "lucide-react";
import { getLatestRate } from "@/data/fxRates";
import { PaymentMode } from "@/data/offers";

export type PremiumBreakdownInput = {
  productName: string;
  templateName?: string;
  currency: string;
  insuredAge?: number;
  termYears: number;
  paymentMode: PaymentMode;
  netPremium?: number;
  tax?: number;
  taxRate?: number;
  commission?: number;
  grossPremium: number;
  basePremium?: number;
  riderPremium?: number;
  ageGenderFactor?: number;
  loanAdjustment?: number;
  templateDiscount?: number;
  manualOverride?: { amount: number; reason?: string };
  fxRate?: number;
  fxSource?: string;
  reportingCurrency?: string; // e.g. "EUR"
};

const fmt = (v: number | undefined, ccy: string) =>
  v === undefined || Number.isNaN(v)
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const Row = ({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: boolean }) => (
  <div className={`flex items-start justify-between gap-4 py-2 ${accent ? "border-t pt-3 mt-1" : ""}`}>
    <div>
      <div className={`text-sm ${accent ? "font-semibold" : "font-medium"}`}>{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[260px]">{hint}</div>}
    </div>
    <div className={`text-sm font-mono ${accent ? "text-primary font-semibold text-base" : ""}`}>{value}</div>
  </div>
);

const explainPaymentMode = (mode: PaymentMode, gross: number, term: number, ccy: string) => {
  switch (mode) {
    case "Pagese per gjithe periudhen (Upfront)":
      return {
        label: mode,
        detail: `Klienti paguan primin e plotë për ${term} vjet sot: ${fmt(gross * term, ccy)} një herë.`,
        firstInstallment: gross * term,
      };
    case "Pagesa me tarife te vetme për të gjithë periudhën":
      return {
        label: mode,
        detail: `Tarife e vetme e përcaktuar për të gjithë periudhën: ${fmt(gross, ccy)} një herë.`,
        firstInstallment: gross,
      };
    default:
      return {
        label: mode,
        detail: `Klienti paguan ${fmt(gross, ccy)} çdo vit për ${term} vjet.`,
        firstInstallment: gross,
      };
  }
};

const PremiumBreakdownPanel = ({ data }: { data: PremiumBreakdownInput }) => {
  const reporting = data.reportingCurrency ?? "EUR";
  const showFx = data.currency !== reporting;
  const fx = showFx ? data.fxRate ?? getLatestRate(data.currency, reporting)?.rate : undefined;
  const fxSource = showFx ? data.fxSource ?? getLatestRate(data.currency, reporting)?.source ?? "Latest automatic rate" : undefined;
  const grossInReporting = showFx && fx ? data.grossPremium * fx : undefined;

  const pay = explainPaymentMode(data.paymentMode, data.grossPremium, data.termYears, data.currency);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Premium Breakdown
            </CardTitle>
            <CardDescription>Plain-language explanation of how this premium was built.</CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px]">{data.currency}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* INPUTS */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inputs used</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Product</div>
              <div className="font-medium">{data.productName}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Template</div>
              <div className="font-medium">{data.templateName ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Insured Age</div>
              <div className="font-medium">{data.insuredAge ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Term</div>
              <div className="font-medium">{data.termYears} years</div>
            </div>
          </div>
        </section>

        {/* CALCULATION */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How the premium is built</h4>
          </div>
          <div className="rounded-md border bg-muted/20 px-3">
            {data.basePremium !== undefined && (
              <Row label="Base premium" value={fmt(data.basePremium, data.currency)} hint="Mandatory coverage from product rate table." />
            )}
            {data.riderPremium !== undefined && data.riderPremium > 0 && (
              <Row label="+ Riders" value={fmt(data.riderPremium, data.currency)} hint="Optional add-ons selected on the offer." />
            )}
            {data.ageGenderFactor !== undefined && data.ageGenderFactor !== 1 && (
              <Row label="× Age/gender factor" value={`× ${data.ageGenderFactor.toFixed(2)}`} hint="Adjustment from underwriting tables." />
            )}
            {data.loanAdjustment !== undefined && data.loanAdjustment !== 0 && (
              <Row label="Loan balance adjustment" value={fmt(data.loanAdjustment, data.currency)} hint="Reflects decreasing exposure on the mortgage." />
            )}
            {data.templateDiscount !== undefined && data.templateDiscount !== 0 && (
              <Row label="− Template discount" value={fmt(-Math.abs(data.templateDiscount), data.currency)} hint="Bundled package discount applied." />
            )}
            {data.manualOverride && (
              <Row
                label="Manual override"
                value={fmt(data.manualOverride.amount, data.currency)}
                hint={data.manualOverride.reason ? `Reason: ${data.manualOverride.reason}` : "Underwriter set premium manually — pending approval."}
              />
            )}
            {data.netPremium !== undefined && (
              <Row label="Net premium" value={fmt(data.netPremium, data.currency)} hint="Premium for the coverage, before tax." />
            )}
            {data.tax !== undefined && data.tax > 0 && (
              <Row
                label={`+ Insurance tax (${((data.taxRate ?? 0.10) * 100).toFixed(0)}%)`}
                value={fmt(data.tax, data.currency)}
                hint="Statutory tax on top of the net premium."
              />
            )}
            <Row label="Gross premium (annual)" value={fmt(data.grossPremium, data.currency)} accent />
            {data.commission !== undefined && data.commission > 0 && (
              <Row
                label="Agent commission"
                value={fmt(data.commission, data.currency)}
                hint="Calculated on the net premium and paid to the distributing agent. Not charged to the customer."
              />
            )}
          </div>
        </section>

        {/* FX */}
        {showFx && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FX conversion</h4>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              {fx ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 font-mono">
                    <span>{fmt(data.grossPremium, data.currency)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-primary font-semibold">{fmt(grossInReporting, reporting)}</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    1 {data.currency} = {fx.toFixed(4)} {reporting}
                  </Badge>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No FX rate found for {data.currency} → {reporting}.</div>
              )}
              <div className="text-[11px] text-muted-foreground mt-1.5">
                Source: {fxSource}. Used to report gross premium in {reporting} for portfolio aggregation.
              </div>
            </div>
          </section>
        )}

        {/* PAYMENT */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Installment plan</h4>
          </div>
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge>{pay.label}</Badge>
              <span className="font-mono text-xs text-muted-foreground">First installment: {fmt(pay.firstInstallment, data.currency)}</span>
            </div>
            <div className="text-[12px] text-muted-foreground mt-2">{pay.detail}</div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

export default PremiumBreakdownPanel;
