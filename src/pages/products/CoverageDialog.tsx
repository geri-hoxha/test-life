import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Coverage, newCoverageId } from "@/data/coverages";
import { useListCoverages } from "@/api/coverages";
import { useListRatingTables } from "@/api/rating-tables";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  versionId: string;
  /** Coverage catalog ids already linked to this product. */
  linkedCoverageIds?: string[];
  onSave: (c: Coverage) => void;
};

type FormState = {
  coverageId: string;
  name: string;
  ratingTableId: string;
  ratingTableMultiplier: number;
  isMandatory: boolean;
};

const blankForm = (): FormState => ({
  coverageId: "",
  name: "",
  ratingTableId: "",
  ratingTableMultiplier: 1,
  isMandatory: true,
});

const CoverageDialog = ({
  open,
  onOpenChange,
  productId,
  versionId,
  linkedCoverageIds = [],
  onSave,
}: Props) => {
  const [form, setForm] = useState<FormState>(blankForm());
  const { data: catalogPage } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: tablesPage } = useListRatingTables({ pageNumber: 1, pageSize: 200 });
  const ratingTables = tablesPage?.items ?? [];

  const availableCoverages = useMemo(() => {
    const linked = new Set(linkedCoverageIds);
    return (catalogPage?.items ?? []).filter((c) => {
      const id = c.id ?? "";
      return Boolean(id) && !linked.has(id);
    });
  }, [catalogPage?.items, linkedCoverageIds]);

  useEffect(() => {
    if (open) setForm(blankForm());
  }, [open]);

  const pickCoverage = (coverageId: string) => {
    const found = availableCoverages.find((x) => x.id === coverageId);
    setForm((s) => ({
      ...s,
      coverageId,
      name: found?.name?.trim() || s.name,
    }));
  };

  const handleSave = () => {
    if (!form.coverageId) {
      toast.error("Select a coverage");
      return;
    }
    if (!form.ratingTableId) {
      toast.error("Select a rating table");
      return;
    }
    onSave({
      id: newCoverageId(),
      productId,
      versionId,
      name: form.name || form.coverageId,
      code: form.coverageId,
      description: "",
      coverageType: form.isMandatory ? "Mandatory" : "Optional Rider",
      sumInsuredType: "Fixed",
      defaultSumInsured: 0,
      minSumInsured: 0,
      maxSumInsured: 0,
      basePremiumType: "Rate table by age/gender",
      basePremiumValue: 0,
      commissionPct: 0,
      isActive: true,
      ratingTableId: form.ratingTableId,
      ratingTableMultiplier: form.ratingTableMultiplier || 1,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link coverage</DialogTitle>
          <DialogDescription>
            Attach an existing coverage to this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Coverage *</Label>
            <Select value={form.coverageId || undefined} onValueChange={pickCoverage}>
              <SelectTrigger>
                <SelectValue placeholder="Select coverage…" />
              </SelectTrigger>
              <SelectContent>
                {availableCoverages.length === 0 ? (
                  <SelectItem value="__none" disabled>No coverages available</SelectItem>
                ) : (
                  availableCoverages.map((cov) => (
                    <SelectItem key={cov.id} value={cov.id ?? ""}>
                      {cov.name ?? cov.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Rating table *</Label>
            <Select
              value={form.ratingTableId || undefined}
              onValueChange={(v) => setForm((s) => ({ ...s, ratingTableId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating table…" />
              </SelectTrigger>
              <SelectContent>
                {ratingTables.map((t) => (
                  <SelectItem key={t.id} value={t.id ?? ""}>
                    {t.name ?? t.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rtm">Rating table multiplier</Label>
            <Input
              id="rtm"
              type="number"
              min={0}
              step="0.01"
              value={form.ratingTableMultiplier}
              onChange={(e) =>
                setForm((s) => ({ ...s, ratingTableMultiplier: +e.target.value }))
              }
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="block">Mandatory</Label>
            <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
              <span className="text-sm">{form.isMandatory ? "Mandatory" : "Optional rider"}</span>
              <Switch
                checked={form.isMandatory}
                onCheckedChange={(v) => setForm((s) => ({ ...s, isMandatory: v }))}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Add coverage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoverageDialog;
