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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  /** When set, the dialog edits this coverage link instead of adding a new one. */
  editing?: Coverage | null;
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
  isSumInsuredFixed: boolean;
  /** Kept as raw input text so the field can start empty. */
  sumInsuredPercentage: string;
};

const blankForm = (): FormState => ({
  source: "existing",
  coverageId: "",
  name: "",
  description: "",
  ratingTableId: "",
  ratingTableMultiplier: 1,
  isMandatory: true,
  isSumInsuredFixed: true,
  sumInsuredPercentage: "",
});

const CoverageDialog = ({
  open,
  onOpenChange,
  productId,
  versionId,
  linkedCoverageIds = [],
  editing = null,
  onSave,
}: Props) => {
  const [form, setForm] = useState<FormState>(blankForm());
  const [comboOpen, setComboOpen] = useState(false);
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
    if (!open) return;
    if (editing) {
      setForm({
        source: "existing",
        coverageId: editing.code !== "N/A" ? editing.code : "",
        name: editing.name,
        description: editing.description ?? "",
        ratingTableId: editing.ratingTableId ?? "",
        ratingTableMultiplier: editing.ratingTableMultiplier ?? 1,
        isMandatory: editing.coverageType === "Mandatory",
        isSumInsuredFixed: editing.isSumInsuredFixed ?? true,
        sumInsuredPercentage:
          editing.sumInsuredPercentage !== undefined ? String(editing.sumInsuredPercentage) : "",
      });
    } else {
      setForm(blankForm());
    }
  }, [open, editing]);

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
    if (!editing && form.source === "existing" && !form.coverageId) {
      toast.error("Select a coverage");
      return;
    }
    if (!editing && form.source === "new" && !form.name.trim()) {
      toast.error("Coverage name is required");
      return;
    }
    if (!form.ratingTableId) {
      toast.error("Select a rating table");
      return;
    }
    onSave({
      id: editing ? editing.id : newCoverageId(),
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
      isSumInsuredFixed: form.isSumInsuredFixed,
      sumInsuredPercentage: form.isSumInsuredFixed
        ? undefined
        : (() => {
            const parsed = parseFloat(form.sumInsuredPercentage);
            return Number.isFinite(parsed) ? parsed : undefined;
          })(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit coverage" : "Add coverage"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the link settings of this coverage."
              : "Select an existing coverage, or create a new one with name and description."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {editing && (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <div className="text-sm font-medium">{editing.name}</div>
              {editing.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{editing.description}</p>
              )}
            </div>
          )}

          {!editing && (
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
                  isSumInsuredFixed: s.isSumInsuredFixed,
                  sumInsuredPercentage: s.sumInsuredPercentage,
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
          )}

          {!editing && (form.source === "existing" ? (
            <div className="space-y-1.5">
              <Label>Coverage *</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {form.coverageId
                        ? availableCoverages.find((x) => x.id === form.coverageId)?.name ?? form.coverageId
                        : "Select coverage…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search coverages…" />
                    <CommandList>
                      <CommandEmpty>
                        {catalogLoading ? "Loading coverages…" : "No coverage found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {availableCoverages.map((cov) => {
                          const id = cov.id ?? "";
                          return (
                            <CommandItem
                              key={id}
                              value={`${cov.name ?? ""} ${id}`}
                              onSelect={() => {
                                pickCoverage(id);
                                setComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  form.coverageId === id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">{cov.name ?? id}</div>
                                {cov.description && (
                                  <p className="text-xs  line-clamp-1">{cov.description}</p>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
          ))}

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

          <div className="space-y-1.5">
            <Label className="block">Sum insured fixed</Label>
            <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
              <span className="text-sm">{form.isSumInsuredFixed ? "Fixed" : "Not fixed"}</span>
              <Switch
                checked={form.isSumInsuredFixed}
                onCheckedChange={(v) => setForm((s) => ({ ...s, isSumInsuredFixed: v }))}
              />
            </label>
            {form.isSumInsuredFixed && (
              <p className="text-xs text-muted-foreground">
                After saving, you must set a Fixed sum insured amount for every supported currency.
              </p>
            )}
          </div>

          {!form.isSumInsuredFixed && (
            <div className="space-y-1.5">
              <Label htmlFor="sip">Sum insured percentage</Label>
              <Input
                id="sip"
                type="number"
                min={0}
                step="0.01"
                value={form.sumInsuredPercentage}
                placeholder="0%"
                onChange={(e) =>
                  setForm((s) => ({ ...s, sumInsuredPercentage: e.target.value }))
                }
                className="font-mono"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {editing ? "Save changes" : "Add coverage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoverageDialog;
