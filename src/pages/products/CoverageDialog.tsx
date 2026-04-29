import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Coverage, CoverageType, SumInsuredType, BasePremiumType, newCoverageId,
} from "@/data/coverages";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  versionId: string;
  initial?: Coverage | null;
  onSave: (c: Coverage) => void;
};

const blank = (productId: string, versionId: string): Coverage => ({
  id: newCoverageId(),
  productId, versionId,
  name: "", code: "", description: "",
  coverageType: "Mandatory",
  sumInsuredType: "Fixed",
  defaultSumInsured: 0, minSumInsured: 0, maxSumInsured: 0,
  basePremiumType: "Fixed amount", basePremiumValue: 0,
  commissionPct: 10, isActive: true,
});

const CoverageDialog = ({ open, onOpenChange, productId, versionId, initial, onSave }: Props) => {
  const [c, setC] = useState<Coverage>(initial ?? blank(productId, versionId));

  useEffect(() => {
    setC(initial ?? blank(productId, versionId));
  }, [initial, productId, versionId, open]);

  const set = <K extends keyof Coverage>(k: K, v: Coverage[K]) => setC((s) => ({ ...s, [k]: v }));

  const handleSave = () => {
    if (!c.name || !c.code) return;
    onSave(c);
    onOpenChange(false);
  };

  const premiumValueLabel =
    c.basePremiumType === "Fixed amount" ? "Base Premium Value (€)"
    : c.basePremiumType === "Percentage of insured amount" ? "Base Premium Value (%)"
    : "Rate Table Reference";

  const showSumInputs = c.sumInsuredType !== "Based on loan amount";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit coverage" : "New coverage"}</DialogTitle>
          <DialogDescription>
            Configure coverage rules for the selected product version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Coverage Name *</Label>
              <Input id="cname" value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="Death Cover" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ccode">Coverage Code *</Label>
              <Input id="ccode" value={c.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="DTH" className="font-mono" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cdesc">Description</Label>
              <Textarea id="cdesc" rows={2} value={c.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="What does this coverage pay out?" />
            </div>
          </div>

          {/* Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Coverage Type</Label>
              <Select value={c.coverageType} onValueChange={(v) => set("coverageType", v as CoverageType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mandatory">Mandatory</SelectItem>
                  <SelectItem value="Optional Rider">Optional Rider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sum Insured Type</Label>
              <Select value={c.sumInsuredType} onValueChange={(v) => set("sumInsuredType", v as SumInsuredType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="User entered">User entered</SelectItem>
                  <SelectItem value="Based on loan amount">Based on loan amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sum insured values */}
          <div className="rounded-md border border-border p-4 bg-muted/30">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Sum insured limits
            </div>
            {showSumInputs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="defs">Default</Label>
                  <Input id="defs" type="number" value={c.defaultSumInsured} onChange={(e) => set("defaultSumInsured", +e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mins">Minimum</Label>
                  <Input id="mins" type="number" value={c.minSumInsured} onChange={(e) => set("minSumInsured", +e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxs">Maximum</Label>
                  <Input id="maxs" type="number" value={c.maxSumInsured} onChange={(e) => set("maxSumInsured", +e.target.value)} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sum insured is derived from the loan amount at offer time. You can still set min / max caps.
              </p>
            )}
          </div>

          {/* Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Base Premium Type</Label>
              <Select value={c.basePremiumType} onValueChange={(v) => set("basePremiumType", v as BasePremiumType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed amount">Fixed amount</SelectItem>
                  <SelectItem value="Percentage of insured amount">Percentage of insured amount</SelectItem>
                  <SelectItem value="Rate table by age/gender">Rate table by age/gender</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bpv">{premiumValueLabel}</Label>
              <Input
                id="bpv"
                type={c.basePremiumType === "Rate table by age/gender" ? "text" : "number"}
                step="0.01"
                value={c.basePremiumValue}
                onChange={(e) => set("basePremiumValue", c.basePremiumType === "Rate table by age/gender" ? (e.target.value as unknown as number) : +e.target.value)}
                placeholder={c.basePremiumType === "Rate table by age/gender" ? "e.g. RT-LIFE-2026" : "0.00"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comm">Commission Percentage (%)</Label>
              <Input id="comm" type="number" step="0.1" value={c.commissionPct} onChange={(e) => set("commissionPct", +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="block">Status</Label>
              <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                <span className="text-sm">{c.isActive ? "Active" : "Inactive"}</span>
                <Switch checked={c.isActive} onCheckedChange={(v) => set("isActive", v)} />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initial ? "Save changes" : "Create coverage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoverageDialog;
