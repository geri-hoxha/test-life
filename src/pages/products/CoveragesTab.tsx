import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Shield, ShieldPlus, Info } from "lucide-react";
import { toast } from "sonner";
import { Coverage } from "@/data/coverages";
import CoverageDialog from "./CoverageDialog";
import { useGetProduct, useAddProductCoverage, useRemoveProductCoverage } from "@/api/products";
import { useListCoverages, useCreateCoverage } from "@/api/coverages";
import { useListRatingTables } from "@/api/rating-tables";
import { mapProductCoverage } from "@/api/adapters/coverages";

type Props = { productId: string };

const VERSION_NA = "N/A";

const CoveragesTab = ({ productId }: Props) => {
  const { data: apiProduct, isLoading: productLoading } = useGetProduct(productId);
  const { data: catalogPage, isLoading: catalogLoading } = useListCoverages({ pageNumber: 1, pageSize: 200 });
  const { data: tablesPage, isLoading: tablesLoading } = useListRatingTables({ pageNumber: 1, pageSize: 200 });
  const addProductCoverage = useAddProductCoverage();
  const removeProductCoverage = useRemoveProductCoverage();
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

  const linkedCoverageIds = useMemo(
    () => (apiProduct?.coverages ?? []).map((e) => e.coverageId ?? "").filter(Boolean),
    [apiProduct?.coverages]
  );

  const mandatory = coverages.filter((c) => c.coverageType === "Mandatory");
  const riders = coverages.filter((c) => c.coverageType === "Optional Rider");

  const ratingTableLabel = (id?: string) => {
    if (!id) return "—";
    const t = ratingTableById[id];
    return t?.name?.trim() || id;
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const renderGroup = (title: string, icon: typeof Shield, items: Coverage[], emptyHint: string) => {
    const Icon = icon;
    return (
      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-accent-soft text-accent flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{items.length} coverage(s)</p>
            </div>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyHint}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-16">Order</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Coverage</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Rating table</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Multiplier</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id} className="hover:bg-accent-soft/40">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {c.sortOrder ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="font-mono text-xs text-accent mt-0.5">{c.code}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{ratingTableLabel(c.ratingTableId)}</div>
                    {c.ratingTableId && ratingTableById[c.ratingTableId]?.name && (
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{c.ratingTableId}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {c.ratingTableMultiplier ?? 1}x
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    );
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Link an existing coverage or create a new one ({`{ name, description }`}), then assign a rating table.
          </span>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Coverage
        </Button>
      </div>

      <div className="space-y-5">
        {renderGroup("Mandatory coverages", Shield, mandatory, "No mandatory coverages yet.")}
        {renderGroup("Optional riders", ShieldPlus, riders, "No optional riders yet.")}
      </div>

      <CoverageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        versionId={VERSION_NA}
        linkedCoverageIds={linkedCoverageIds}
        onSave={(c) => void handleSave(c)}
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
