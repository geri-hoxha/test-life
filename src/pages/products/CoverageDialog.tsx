import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  source: "existing" | "new";
  coverageId: string;
  name: string;
  description: string;
  ratingTableId: string;
  ratingTableMultiplier: number;
  isMandatory: boolean;
};

const blankForm = (): FormState => ({
  source: "existing",
  coverageId: "",
  name: "",
  description: "",
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
  const { data: catalogPage, isLoading: catalogLoading } = useListCoverages({ pageNumber: 1, pageSize: 200 });
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
      source: "existing",
      coverageId,
      name: found?.name?.trim() || s.name,
      description: found?.description ?? "",
    }));
  };

  const handleSave = () => {
    if (form.source === "existing" && !form.coverageId) {
      toast.error("Select a coverage");
      return;
    }
    if (form.source === "new" && !form.name.trim()) {
      toast.error("Coverage name is required");
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
      name: form.source === "new" ? form.name.trim() : (form.name || form.coverageId),
      code: form.source === "existing" ? form.coverageId : "N/A",
      description: form.description.trim() || undefined,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add coverage</DialogTitle>
          <DialogDescription>
            Select an existing coverage, or create a new one with name and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select
              value={form.source}
              onValueChange={(v) =>
                setForm((s) => ({
                  ...blankForm(),
                  source: v as "existing" | "new",
                  ratingTableId: s.ratingTableId,
                  ratingTableMultiplier: s.ratingTableMultiplier,
                  isMandatory: s.isMandatory,
                }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">Existing coverage</SelectItem>
                <SelectItem value="new">Create new coverage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.source === "existing" ? (
            <div className="space-y-1.5">
              <Label>Coverage *</Label>
              <div className="rounded-md border border-border">
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {catalogLoading && (
                    <p className="text-xs text-muted-foreground p-3">Loading coverages…</p>
                  )}
                  {!catalogLoading && availableCoverages.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">
                      No coverages available. Switch to Create new coverage.
                    </p>
                  )}
                  {availableCoverages.map((cov) => {
                    const id = cov.id ?? "";
                    const selected = form.coverageId === id;
                    return (
                      <label
                        key={id}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-accent-soft/40 ${
                          selected ? "bg-accent-soft/50" : ""
                        }`}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={selected}
                          onCheckedChange={(v) => {
                            if (v) pickCoverage(id);
                            else {
                              setForm((s) => ({
                                ...s,
                                coverageId: "",
                                name: "",
                                description: "",
                              }));
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{cov.name ?? id}</div>
                          {cov.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cov.description}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cov-name">Name *</Label>
                <Input
                  id="cov-name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Death, Disability…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cov-desc">Description</Label>
                <Input
                  id="cov-desc"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="What does this coverage pay out?"
                />
              </div>
            </div>
          )}

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
