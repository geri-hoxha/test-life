import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Coins, ArrowRight } from "lucide-react";
import { getLatestRate } from "@/data/fxRates";

export type PremiumBreakdownInput = {
  currency: string;
  grossPremium: number;
  taxRate?: number;              // default 0.10
  bankCommissionPct?: number;    // decimal, e.g. 0.40
  agentCommissionPct?: number;   // decimal, e.g. 0.10
  fxRate?: number;
  fxSource?: string;
  reportingCurrency?: string;    // default "EUR"
};

const fmt = (v: number | undefined, ccy: string) =>
  v === undefined || Number.isNaN(v)
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(v);

const Row = ({
  label,
  value,
  hint,
  accent,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
  muted?: boolean;
}) => (
  <div className={`flex items-start justify-between gap-4 py-2 ${accent ? "border-t pt-3 mt-1" : ""}`}>
    <div>
      <div className={`text-sm ${accent ? "font-semibold" : muted ? "text-muted-foreground" : "font-medium"}`}>
        {label}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
    <div className={`text-sm font-mono ${accent ? "text-primary font-semibold text-base" : muted ? "text-muted-foreground" : ""}`}>
      {value}
    </div>
  </div>
);

const PremiumBreakdownPanel = ({ data }: { data: PremiumBreakdownInput }) => {
  const taxRate = data.taxRate ?? 0.10;
  const gross = data.grossPremium;
  const tax = +(gross * taxRate / (1 + taxRate)).toFixed(2); // gross is tax-inclusive
  const net = +(gross - tax).toFixed(2);

  const bankPct = data.bankCommissionPct ?? 0;
  const agentPct = data.agentCommissionPct ?? 0;
  const bankAmt = +(net * bankPct).toFixed(2);
  const agentAmt = +(net * agentPct).toFixed(2);

  const reporting = data.reportingCurrency ?? "EUR";
  const showFx = data.currency !== reporting;
  const fx = showFx ? data.fxRate ?? getLatestRate(data.currency, reporting)?.rate : undefined;
  const fxSource = showFx
    ? data.fxSource ?? getLatestRate(data.currency, reporting)?.source ?? "Latest automatic rate"
    : undefined;
  const grossInReporting = showFx && fx ? gross * fx : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Premium Breakdown
            </CardTitle>
            <CardDescription>How this premium is built and split.</CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px]">{data.currency}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Premium composition */}
        <section>
          <div className="rounded-md border bg-muted/20 px-3">
            <Row label="Gross Premium" value={fmt(gross, data.currency)} hint="Total amount the customer pays." />
            <Row
              label={`State Tax (${(taxRate * 100).toFixed(0)}%)`}
              value={`− ${fmt(tax, data.currency)}`}
              hint="Statutory insurance tax remitted to the state."
              muted
            />
            <Row label="NET Premium" value={fmt(net, data.currency)} accent />
          </div>
        </section>

        {/* Commissions */}
        {(bankPct > 0 || agentPct > 0) && (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Commissions (paid from NET)
            </h4>
            <div className="rounded-md border bg-muted/20 px-3">
              {bankPct > 0 && (
                <Row
                  label={`Bank Commission (${(bankPct * 100).toFixed(0)}%)`}
                  value={fmt(bankAmt, data.currency)}
                  hint="Paid to the distributing bank partner."
                />
              )}
              {agentPct > 0 && (
                <Row
                  label={`Agent Commission (${(agentPct * 100).toFixed(0)}%)`}
                  value={fmt(agentAmt, data.currency)}
                  hint="Paid to the selling agent."
                />
              )}
            </div>
          </section>
        )}

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
                    <span>{fmt(gross, data.currency)}</span>
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
      </CardContent>
    </Card>
  );
};

export default PremiumBreakdownPanel;
