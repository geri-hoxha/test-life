import { Fragment, useMemo, useState } from "react";
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
import { Plus, Trash2, Shield, Info, Loader2, Save, Pencil } from "lucide-react";
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

/** Single row of a limit-type table: currency, type, value input, icon actions. */
const CurrencyLimitRow = ({
  productId,
  coverageEntryId,
  currency,
  type,
  existing,
}: {
  productId: string;
  coverageEntryId: string;
  currency: string;
  type: ProductsCurrencyLimitType;
  existing?: { id?: string | number; value?: number };
}) => {
  const [value, setValue] = useState<string>(
    existing?.value !== undefined ? String(existing.value) : ""
  );
  const addLimit = useAddProductCoverageCurrencyLimit();
  const removeLimit = useRemoveProductCoverageCurrencyLimit();

  const save = async () => {
    const parsed = Number(value);
    if (value.trim() === "" || Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid non-negative value");
      return;
    }
    try {
      await addLimit.mutateAsync({
        productId,
        coverageEntryId,
        body: { currency, type, value: parsed },
      });
      toast.success(`${currency} limit saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save limit");
    }
  };

  const remove = async () => {
    if (existing?.id === undefined) return;
    try {
      await removeLimit.mutateAsync({
        productId,
        coverageEntryId,
        currencyLimitEntryId: String(existing.id),
      });
      setValue("");
      toast.success(`${currency} limit removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove limit");
    }
  };

  return (
    <TableRow>
      <TableCell className="py-2 font-mono text-xs font-medium">{currency}</TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="h-7 w-24 text-xs"
          />
          <Button
            variant="link"
            size="icon"
            className="h-7 w-7 shrink-0 text-emerald-600 hover:text-emerald-700"
            title="Save limit"
            onClick={() => void save()}
            disabled={addLimit.isPending}
          >
            {addLimit.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
          </Button>
          {existing?.id !== undefined && (
            <Button
              variant="link"
              size="icon"
              className="h-7 w-7 shrink-0 text-destructive"
              title="Remove limit"
              onClick={() => void remove()}
              disabled={removeLimit.isPending}
            >
              {removeLimit.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

/** One table per limit type: currency, type, value (with icon actions). */
const LimitTypeTable = ({
  productId,
  coverage,
  type,
  label,
  currencies,
}: {
  productId: string;
  coverage: Coverage;
  type: ProductsCurrencyLimitType;
  label: string;
  currencies: string[];
}) => {
  const limitsOfType = (coverage.currencyLimits ?? []).filter((l) => l.type === type);
  const limitsByCurrency = Object.fromEntries(limitsOfType.map((l) => [l.currency ?? "", l]));
  // Show every existing limit of this type, even if its currency is no longer supported.
  const rowCurrencies = [
    ...currencies,
    ...limitsOfType.map((l) => l.currency ?? "").filter((cur) => cur && !currencies.includes(cur)),
  ];

  return (
    <div className="rounded-md border border-border bg-background overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted/40">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
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
            <CurrencyLimitRow
              key={`${coverage.id}:${type}:${currency}:${limitsByCurrency[currency]?.id ?? "new"}`}
              productId={productId}
              coverageEntryId={coverage.id}
              currency={currency}
              type={type}
              existing={limitsByCurrency[currency]}
            />
          ))}
        </TableBody>
      </Table>
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
  /** Checked limit-type checkboxes, keyed by `${coverageEntryId}:${type}`. */
  const [selectedLimits, setSelectedLimits] = useState<Set<string>>(new Set());

  const limitKey = (entryId: string, type: ProductsCurrencyLimitType) => `${entryId}:${type}`;
  const isLimitSelected = (entryId: string, type: ProductsCurrencyLimitType) =>
    selectedLimits.has(limitKey(entryId, type));

  const toggleLimit = (entryId: string, type: ProductsCurrencyLimitType) => {
    setSelectedLimits((prev) => {
      const next = new Set(prev);
      const key = limitKey(entryId, type);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleUpdate = async (c: Coverage) => {
    if (!c.ratingTableId) {
      toast.error("Rating table is required");
      return;
    }
    try {
      await updateProductCoverage.mutateAsync({
        productId,
        coverageEntryId: c.id,
        body: {
          coverageId: c.code !== "N/A" ? c.code : undefined,
          ratingTableId: c.ratingTableId,
          ratingTableMultiplier: c.ratingTableMultiplier ?? 1,
          isMandatory: c.coverageType === "Mandatory",
          isSumInsuredFixed: c.isSumInsuredFixed ?? true,
          ...((c.isSumInsuredFixed ?? true)
            ? {}
            : { sumInsuredPercentage: c.sumInsuredPercentage ?? 1 }),
        },
      });
      toast.success(`Coverage ${c.name} updated`);
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
      await addProductCoverage.mutateAsync({
        productId,
        body: {
          coverageId,
          ratingTableId: c.ratingTableId,
          ratingTableMultiplier: c.ratingTableMultiplier ?? 1,
          isMandatory: c.coverageType === "Mandatory",
          isSumInsuredFixed: c.isSumInsuredFixed ?? true,
          ...((c.isSumInsuredFixed ?? true)
            ? {}
            : { sumInsuredPercentage: c.sumInsuredPercentage ?? 1 }),
        },
      });
      toast.success(`Coverage ${c.name} linked to product`);
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
            Link an existing coverage or create a new one ({`{ name, description }`}), then assign a rating table.
            Use the limit checkboxes to configure per-currency limits.
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
              {coverages.map((c) => (
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
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={c.isSumInsuredFixed ?? true}
                          className="pointer-events-none data-[state=checked]:bg-emerald-600"
                          tabIndex={-1}
                          aria-readonly
                        />
                        {!(c.isSumInsuredFixed ?? true) && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {Math.round((c.sumInsuredPercentage ?? 1) * 100)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {CHECKBOX_LIMIT_TYPES.map(({ type }) => (
                      <TableCell key={type} className="align-top text-center">
                        <Checkbox
                          className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                          checked={isLimitSelected(c.id, type)}
                          onCheckedChange={() => toggleLimit(c.id, type)}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="align-top text-right">
                      <div className="flex justify-end gap-1.5">
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
                  {CHECKBOX_LIMIT_TYPES.some(({ type }) => isLimitSelected(c.id, type)) && (
                    <TableRow className="hover:bg-transparent bg-muted/20">
                      <TableCell colSpan={COL_COUNT} className="p-4">
                        <div
                          className={`grid grid-cols-2 gap-3 ${
                            (c.isSumInsuredFixed ?? true) ? "xl:grid-cols-4" : "xl:grid-cols-3"
                          }`}
                        >
                          {ALL_LIMIT_TYPES.filter(({ type }) =>
                            type === "fixedSumInsuredAmount"
                              ? (c.isSumInsuredFixed ?? true)
                              : isLimitSelected(c.id, type)
                          ).map(({ type, label }) => (
                            <LimitTypeTable
                              key={type}
                              productId={productId}
                              coverage={c}
                              type={type}
                              label={label}
                              currencies={supportedCurrencies}
                            />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
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
