import { useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, ShieldPlus, Calculator, FileText, AlertCircle, Check, Coins } from "lucide-react";
import { Template, overrideSummary } from "@/data/templates";
import { listCoverages } from "@/data/coverages";
import { getProduct } from "@/data/products";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; template: Template | null };

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-accent" />
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
    </div>
    {children}
  </div>
);

const TemplateDetailDialog = ({ open, onOpenChange, template }: Props) => {
  const product = template ? getProduct(template.productId) : undefined;
  const coverages = useMemo(
    () => (template ? listCoverages(template.productId, template.versionId) : []),
    [template]
  );

  if (!template || !product) return null;

  const included = coverages.filter((c) => template.includedCoverageIds.includes(c.id));
  const riders = coverages.filter((c) => template.optionalRiderIds.includes(c.id));

  const flagList = [
    { label: "PEP check required", on: product.flags.pep },
    { label: "High insured amount requires review", on: product.flags.highInsuredAmount },
    { label: "Total customer exposure requires review", on: product.flags.totalExposure },
    { label: "Manual underwriting required", on: product.flags.manualUnderwriting },
    { label: "Compliance review required", on: product.flags.compliance },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{template.name}</DialogTitle>
            <Badge className={template.isActive ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <DialogDescription>{template.description || "—"}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          <Section icon={Shield} title="Included mandatory coverages">
            <Card className="p-3 shadow-none border-border">
              {included.length === 0 ? (
                <p className="text-xs text-muted-foreground">No coverages selected.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {included.map((c) => (
                    <li key={c.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-[11px] font-mono text-accent">{c.code}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Mandatory</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>

          <Section icon={ShieldPlus} title="Optional riders available">
            <Card className="p-3 shadow-none border-border">
              {riders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No riders available.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {riders.map((c) => (
                    <li key={c.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-[11px] font-mono text-accent">{c.code}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Rider</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>

          <Section icon={Calculator} title="Premium override summary">
            <Card className="p-4 shadow-none border-border">
              <div className="text-xs text-muted-foreground">Override type</div>
              <div className="text-sm font-medium mt-0.5">{template.premiumOverrideType}</div>
              <div className="mt-3 text-xs text-muted-foreground">Effect</div>
              <div className="text-sm mt-0.5">{overrideSummary(template, template.defaultCurrency)}</div>
              <div className="mt-3 text-xs text-muted-foreground">Commission override</div>
              <div className="text-sm font-medium mt-0.5">{(template.commissionOverridePct ?? 0).toFixed(1)} %</div>
            </Card>
          </Section>

          <Section icon={Coins} title="Currencies">
            <Card className="p-4 shadow-none border-border">
              <div className="text-xs text-muted-foreground">Default</div>
              <Badge className="mt-1 font-mono bg-accent text-accent-foreground border-0">{template.defaultCurrency}</Badge>
              <div className="text-xs text-muted-foreground mt-3">Allowed</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {template.allowedCurrencies.map((c) => (
                  <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                ))}
              </div>
            </Card>
          </Section>

          <Section icon={FileText} title="Required documents (inherited)">
            <Card className="p-4 shadow-none border-border">
              <div className="flex flex-wrap gap-1.5">
                {product.requiredDocuments.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                {product.requiredDocuments.map((d) => (
                  <Badge key={d} className="bg-accent-soft text-accent-soft-foreground border-0">{d}</Badge>
                ))}
              </div>
            </Card>
          </Section>

          <Section icon={AlertCircle} title="Verification flags (inherited)">
            <Card className="p-4 shadow-none border-border">
              <ul className="space-y-1.5">
                {flagList.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className={`h-4 w-4 rounded-sm flex items-center justify-center ${f.on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {f.on && <Check className="h-3 w-3" />}
                    </span>
                    <span className={f.on ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDetailDialog;
