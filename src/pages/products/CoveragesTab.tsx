import { Fragment, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Shield, Info, Loader2, Save, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Coverage } from "@/data/coverages";
import CoverageDialog from "./CoverageDialog";
import {
  useGetProduct,
  useAddProductCoverage,
  useRemoveProductCoverage,
  useUpdateProductCoverage,
  useAddProductCoverageCurrencyLimit,
  useRemoveProductCoverageCurrencyLimit,
} from "@/api/products";
import { useListCoverages, useCreateCoverage } from "@/api/coverages";
import { useListRatingTables } from "@/api/rating-tables";
import { mapProductCoverage } from "@/api/adapters/coverages";
import type { ProductsCurrencyLimitType } from "@/api/types";

type Props = { productId: string };

const VERSION_NA = "N/A";

const ALL_LIMIT_TYPES: { type: ProductsCurrencyLimitType; label: string }[] = [
  { type: "fixedSumInsuredAmount", label: "Fixed sum insured amount" },
  { type: "minimumPremium", label: "Minimum premium" },
  { type: "yearlyLimit", label: "Yearly limit" },
  { type: "aggregateLimit", label: "Aggregate limit" },
];

/** Limit types shown as checkboxes in the parent table. */
const CHECKBOX_LIMIT_TYPES = ALL_LIMIT_TYPES.filter(
  (t) => t.type !== "fixedSumInsuredAmount"
);

const limitKey = (entryId: string, type: ProductsCurrencyLimitType) => `${entryId}:${type}`;

/** True when every supported currency has a saved limit of this type. */
const hasAllCurrencyLimits = (
  coverage: Coverage,
  type: ProductsCurrencyLimitType,
  currencies: string[]
) => {
  if (currencies.length === 0) return false;
  const have = new Set(
    (coverage.currencyLimits ?? [])
      .filter((l) => l.type === type && l.currency && l.value !== undefined)
      .map((l) => l.currency as string)
  );
  return currencies.every((cur) => have.has(cur));
};

const missingCurrenciesForType = (
  coverage: Coverage,
  type: ProductsCurrencyLimitType,
  currencies: string[]
) => {
  const have = new Set(
    (coverage.currencyLimits ?? [])
      .filter((l) => l.type === type && l.currency && l.value !== undefined)
      .map((l) => l.currency as string)
  );
  return currencies.filter((cur) => !have.has(cur));
};

const missingFixedSumInsuredCurrencies = (coverage: Coverage, currencies: string[]) => {
  if (!(coverage.isSumInsuredFixed ?? true)) return [];
  return missingCurrenciesForType(coverage, "fixedSumInsuredAmount", currencies);
};

/**
 * Mini-table for one limit type: fill ALL currencies, then one Save that
 * posts one currency-limits request per currency.
 */
const LimitTypeTable = ({
  productId,
  coverage,
  type,
  label,
  currencies,
  required = false,
}: {
  productId: string;
  coverage: Coverage;
  type: ProductsCurrencyLimitType;
  label: string;
  currencies: string[];
  required?: boolean;
}) => {
  const limitsOfType = (coverage.currencyLimits ?? []).filter((l) => l.type === type);
  const limitsByCurrency = Object.fromEntries(limitsOfType.map((l) => [l.currency ?? "", l]));
  const rowCurrencies = [
    ...currencies,
    ...limitsOfType.map((l) => l.currency ?? "").filter((cur) => cur && !currencies.includes(cur)),
  ];

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rowCurrencies.map((cur) => [
        cur,
        limitsByCurrency[cur]?.value !== undefined ? String(limitsByCurrency[cur].value) : "",
      ])
    )
  );
  const [saving, setSaving] = useState(false);
  const addLimit = useAddProductCoverageCurrencyLimit();
  const removeLimit = useRemoveProductCoverageCurrencyLimit();

  // Sync when server data changes (after save / refetch).
  useEffect(() => {
    setValues(
      Object.fromEntries(
        rowCurrencies.map((cur) => [
          cur,
          limitsByCurrency[cur]?.value !== undefined ? String(limitsByCurrency[cur].value) : "",
        ])
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh from coverage.currencyLimits
  }, [coverage.id, type, coverage.currencyLimits, currencies.join("|")]);

  const incomplete = rowCurrencies.filter((cur) => {
    const raw = (values[cur] ?? "").trim();
    if (raw === "") return true;
    const n = Number(raw);
    return Number.isNaN(n) || n < 0;
  });

  const saveAll = async () => {
    if (rowCurrencies.length === 0) {
      toast.error("This product has no supported currencies");
      return;
    }
    if (incomplete.length > 0) {
      toast.error(`Fill a value for every currency before saving (${incomplete.join(", ")})`);
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        rowCurrencies.map((currency) =>
          addLimit.mutateAsync({
            productId,
            coverageEntryId: coverage.id,
            body: { currency, type, value: Number(values[currency]) },
          })
        )
      );
      toast.success(`Saved ${rowCurrencies.length} ${label.toLowerCase()} limit(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save currency limits");
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    const existing = rowCurrencies
      .map((cur) => limitsByCurrency[cur])
      .filter((l): l is NonNullable<typeof l> => l?.id !== undefined);
    if (existing.length === 0) {
      setValues(Object.fromEntries(rowCurrencies.map((cur) => [cur, ""])));
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        existing.map((l) =>
          removeLimit.mutateAsync({
            productId,
            coverageEntryId: coverage.id,
            currencyLimitEntryId: String(l.id),
          })
        )
      );
      setValues(Object.fromEntries(rowCurrencies.map((cur) => [cur, ""])));
      toast.success(`Cleared ${label.toLowerCase()} limits`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear limits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-md border bg-background overflow-hidden ${
        required && incomplete.length > 0 ? "border-amber-500/60" : "border-border"
      }`}
    >
      <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-center   gap-2">
        <span className="text-xs font-semibold uppercase ">
          {label}
          {required && <span className="text-amber-600 ml-1">*</span>}
        </span>
        <div className="flex items-center gap-1">
          {required && incomplete.length > 0 && (
            <span className="text-[10px] text-amber-700 mr-1 whitespace-nowrap">
              Fill all currencies
            </span>
          )}
          <Button
            variant="link"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
            title="Save all currency limits"
            onClick={() => void saveAll()}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="link"
            size="icon"
            className="h-7 w-7 text-destructive"
            title="Clear all limits of this type"
            onClick={() => void clearAll()}
            disabled={saving}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="h-8 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Currency</TableHead>
            <TableHead className="h-8 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowCurrencies.map((currency) => (
            <TableRow key={`${coverage.id}:${type}:${currency}`}>
              <TableCell className="py-2 font-mono text-xs font-medium">{currency}</TableCell>
              <TableCell className="py-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={values[currency] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [currency]: e.target.value }))
                  }
                  placeholder="Value"
                  className="h-7 w-28 text-xs"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
        Fill every currency, then save — {rowCurrencies.length || 0} request(s) will be sent.
      </div>
    </div>
  );
};

const CoveragesTab = ({ productId }: Props) => {
  const { data: apiProduct, isLoading: productLoading } = useGetProduct(productId);
  const { data: catalogPage, isLoading: catalogLoading } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: tablesPage, isLoading: tablesLoading } = useListRatingTables({ pageNumber: 1, pageSize: 200 });
  const addProductCoverage = useAddProductCoverage();
  const removeProductCoverage = useRemoveProductCoverage();
  const updateProductCoverage = useUpdateProductCoverage();
  const createCoverageMut = useCreateCoverage();

  const catalogById = useMemo(
    () => Object.fromEntries((catalogPage?.items ?? []).map((c) => [c.id ?? "", c])),
    [catalogPage?.items]
  );

  const ratingTableById = useMemo(
    () => Object.fromEntries((tablesPage?.items ?? []).map((t) => [t.id ?? "", t])),
    [tablesPage?.items]
  );

  const coverages = useMemo(
    () =>
      (apiProduct?.coverages ?? [])
        .map((entry) =>
          mapProductCoverage(productId, entry, catalogById[entry.coverageId ?? ""])
        )
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [apiProduct?.coverages, catalogById, productId]
  );

  const supportedCurrencies = apiProduct?.supportedCurrencies ?? [];

  const linkedCoverageIds = useMemo(
    () => (apiProduct?.coverages ?? []).map((e) => e.coverageId ?? "").filter(Boolean),
    [apiProduct?.coverages]
  );

  const ratingTableLabel = (id?: string) => {
    if (!id) return "—";
    const t = ratingTableById[id];
    return t?.name?.trim() || id;
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoverage, setEditCoverage] = useState<Coverage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  /** Limit types the agent selected to configure (plus complete ones synced from API). */
  const [selectedLimits, setSelectedLimits] = useState<Set<string>>(new Set());
  /** Coverage entry ids whose currency-limits panel is expanded. */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-expand coverages that still need required fixed sum insured amounts.
  useEffect(() => {
    if (supportedCurrencies.length === 0) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const c of coverages) {
        if (missingFixedSumInsuredCurrencies(c, supportedCurrencies).length > 0) {
          next.add(c.id);
        }
      }
      return next;
    });
  }, [coverages, supportedCurrencies]);

  const isLimitSelected = (entryId: string, type: ProductsCurrencyLimitType) =>
    selectedLimits.has(limitKey(entryId, type));

  const toggleLimit = (coverage: Coverage, type: ProductsCurrencyLimitType) => {
    const complete = hasAllCurrencyLimits(coverage, type, supportedCurrencies);
    // Complete types stay checked from saved data; clicking just opens the editor.
    if (complete) {
      setExpandedIds((prev) => new Set(prev).add(coverage.id));
      return;
    }
    const key = limitKey(coverage.id, type);
    const currentlySelected = selectedLimits.has(key);
    setSelectedLimits((prev) => {
      const next = new Set(prev);
      if (currentlySelected) next.delete(key);
      else next.add(key);
      return next;
    });
    if (!currentlySelected) {
      setExpandedIds((prev) => new Set(prev).add(coverage.id));
    }
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const handleUpdate = async (c: Coverage) => {
    if (!c.ratingTableId) {
      toast.error("Rating table is required");
      return;
    }
    const isFixed = c.isSumInsuredFixed ?? true;
    try {
      await updateProductCoverage.mutateAsync({
        productId,
        coverageEntryId: c.id,
        body: {
          coverageId: c.code !== "N/A" ? c.code : undefined,
          ratingTableId: c.ratingTableId,
          ratingTableMultiplier: c.ratingTableMultiplier ?? 1,
          isMandatory: c.coverageType === "Mandatory",
          isSumInsuredFixed: isFixed,
          ...(isFixed ? {} : { sumInsuredPercentage: c.sumInsuredPercentage ?? 1 }),
        },
      });
      toast.success(`Coverage ${c.name} updated`);
      if (isFixed) {
        const existing = coverages.find((x) => x.id === c.id);
        const missing = missingFixedSumInsuredCurrencies(
          { ...c, isSumInsuredFixed: true, currencyLimits: existing?.currencyLimits },
          supportedCurrencies
        );
        if (missing.length > 0) {
          setExpandedIds((prev) => new Set(prev).add(c.id));
          toast.warning(
            `Fill Fixed sum insured amount for: ${missing.join(", ")} — this is required.`
          );
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update coverage");
    }
  };

  const handleSave = async (c: Coverage) => {
    if (!c.ratingTableId) {
      toast.error("Rating table is required");
      return;
    }
    try {
      let coverageId = c.code !== "N/A" ? c.code : undefined;
      if (!coverageId) {
        const created = await createCoverageMut.mutateAsync({
          name: c.name.trim(),
          description: c.description?.trim() || undefined,
        });
        if (!created.id) throw new Error("Coverage created without id");
        coverageId = created.id;
      }
      const isFixed = c.isSumInsuredFixed ?? true;
      await addProductCoverage.mutateAsync({
        productId,
        body: {
          coverageId,
          ratingTableId: c.ratingTableId,
          ratingTableMultiplier: c.ratingTableMultiplier ?? 1,
          isMandatory: c.coverageType === "Mandatory",
          isSumInsuredFixed: isFixed,
          ...(isFixed ? {} : { sumInsuredPercentage: c.sumInsuredPercentage ?? 1 }),
        },
      });
      toast.success(`Coverage ${c.name} linked to product`);
      if (isFixed) {
        toast.warning(
          "Fill Fixed sum insured amount for every supported currency — this is required."
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link coverage");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await removeProductCoverage.mutateAsync({
        productId,
        coverageEntryId: deleteId,
      });
      setDeleteId(null);
      toast.success("Coverage removed from product");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove coverage");
    }
  };

  if (productLoading || catalogLoading || tablesLoading) {
    return (
      <Card className="p-10 text-center shadow-card border-border border-dashed">
        <p className="text-sm text-muted-foreground">Loading coverages…</p>
      </Card>
    );
  }

  const COL_COUNT = 10;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Check a limit type, open currency limits, fill every supported currency, then save
            (one API request per currency). Checkboxes stay checked when all currencies are filled.
          </span>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Coverage
        </Button>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-accent-soft text-accent flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Coverages</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{coverages.length} coverage(s)</p>
            </div>
          </div>
        </div>
        {coverages.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No coverages linked yet.</div>
        ) : (
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Coverage</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Description</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Mandatory</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Rating table</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Multiplier</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Sum insured fixed</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">Min premium</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">Yearly limit</TableHead>
                <TableHead className="text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">Aggregate limit</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverages.map((c) => {
                const isExpanded = expandedIds.has(c.id);
                const isFixed = c.isSumInsuredFixed ?? true;
                const missingFixed = missingFixedSumInsuredCurrencies(c, supportedCurrencies);

                return (
                  <Fragment key={c.id}>
                    <TableRow className="hover:bg-accent-soft/40">
                      <TableCell className="align-top">
                        <div className="font-medium text-foreground whitespace-nowrap">{c.name}</div>
                      </TableCell>
                      <TableCell className="align-top max-w-md">
                        {c.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-3" title={c.description}>
                            {c.description}
                          </p>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {c.coverageType === "Mandatory" ? (
                          <Badge className="text-[10px] bg-emerald-600 text-white hover:bg-emerald-600">Mandatory</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-sm whitespace-nowrap">{ratingTableLabel(c.ratingTableId)}</div>
                      </TableCell>
                      <TableCell className="align-top font-mono text-sm">
                        {c.ratingTableMultiplier ?? 1}x
                      </TableCell>
                      <TableCell className="align-top text-sm whitespace-nowrap">
                      {(c.isSumInsuredFixed ?? true) ? (
                        <Switch
                          checked
                          className="pointer-events-none data-[state=checked]:bg-emerald-600"
                          tabIndex={-1}
                          aria-readonly
                        />
                      ) : (
                        <span className="font-mono text-sm ">
                          {Math.round((c.sumInsuredPercentage ?? 1) * 100)}%
                        </span>
                      )}
                    </TableCell>
                      {CHECKBOX_LIMIT_TYPES.map(({ type }) => {
                        const complete = hasAllCurrencyLimits(c, type, supportedCurrencies);
                        const selected = isLimitSelected(c.id, type);
                        return (
                          <TableCell key={type} className="align-top text-center">
                            <Checkbox
                              className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                              checked={complete || selected}
                              onCheckedChange={() => toggleLimit(c, type)}
                              title={
                                complete
                                  ? "All currencies filled for this limit type"
                                  : "Select to configure this limit type for all currencies"
                              }
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1"
                            title={isExpanded ? "Hide currency limits" : "Show currency limits"}
                            onClick={() => toggleExpanded(c.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {isExpanded ? "Hide limits" : "Show limits"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit coverage"
                            onClick={() => {
                              setEditCoverage(c);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            title="Remove coverage"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent bg-muted/20">
                        <TableCell colSpan={COL_COUNT} className="p-4">
                          {(() => {
                            const displayTypes = ALL_LIMIT_TYPES.filter(({ type }) =>
                              type === "fixedSumInsuredAmount"
                                ? isFixed
                                : isLimitSelected(c.id, type) ||
                                  hasAllCurrencyLimits(c, type, supportedCurrencies)
                            );

                            if (displayTypes.length === 0) {
                              return (
                                <p className="text-sm text-muted-foreground">
                                  Check Min premium, Yearly limit, or Aggregate limit to configure
                                  currency limits for this coverage.
                                </p>
                              );
                            }

                            const colClass =
                              displayTypes.length >= 4
                                ? "xl:grid-cols-4"
                                : displayTypes.length === 3
                                  ? "xl:grid-cols-3"
                                  : displayTypes.length === 2
                                    ? "xl:grid-cols-2"
                                    : "xl:grid-cols-1";

                            return (
                              <>
                                {isFixed && missingFixed.length > 0 && (
                                  <p className="text-xs text-amber-700 mb-3">
                                    Fixed sum insured amount is required for every supported currency
                                    (missing: {missingFixed.join(", ")}).
                                  </p>
                                )}
                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${colClass}`}>
                                  {displayTypes.map(({ type, label }) => (
                                    <LimitTypeTable
                                      key={type}
                                      productId={productId}
                                      coverage={c}
                                      type={type}
                                      label={label}
                                      currencies={supportedCurrencies}
                                      required={type === "fixedSumInsuredAmount"}
                                    />
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <CoverageDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditCoverage(null);
        }}
        productId={productId}
        versionId={VERSION_NA}
        linkedCoverageIds={linkedCoverageIds}
        editing={editCoverage}
        onSave={(c) => void (editCoverage ? handleUpdate(c) : handleSave(c))}
      />

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove coverage?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the coverage from this product. Existing offers and policies are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CoveragesTab;
