import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { FilterGrid } from "@/components/FilterGrid";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { ProductDocument } from "@/data/documents";
import DocumentDialog from "./DocumentDialog";
import {
  useGetProduct,
  useAddProductDocumentType,
  useRemoveProductDocumentType,
  buildAddProductDocumentTypeBody,
} from "@/api/products";
import {
  buildDocumentTypeWriteBody,
  useListDocumentTypes,
  useCreateDocumentType,
} from "@/api/document-types";
import {
  createDocument,
  buildCreateDocumentFormData,
} from "@/api/documents";
import { mapProductDocumentType } from "@/api/adapters/document-types";

type Props = { productId: string };

const VERSION_NA = "N/A";

const formatAmount = (value: number | null | undefined, currency?: string | null) => {
  if (value == null) return "—";
  const amount = value.toLocaleString();
  return currency ? `${amount} ${currency}` : amount;
};

const YesNoBadge = ({ value }: { value: boolean | null | undefined }) => {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return value ? (
    <Badge className="bg-success/15 text-success border-0">Yes</Badge>
  ) : (
    <Badge className="bg-muted text-muted-foreground border-0">No</Badge>
  );
};

const AlwaysRequiredBadge = ({ value }: { value: boolean | null | undefined }) => {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return value ? (
    <Badge className="bg-success/15 text-success border-0">Yes</Badge>
  ) : (
    <Badge className="bg-destructive/15 text-destructive border-0">No</Badge>
  );
};

const DocumentsTab = ({ productId }: Props) => {
  const { data: apiProduct, isLoading: productLoading } = useGetProduct(productId);
  const { data: typesPage, isLoading: typesLoading } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const addProductDocumentType = useAddProductDocumentType();
  const removeProductDocumentType = useRemoveProductDocumentType();
  const createDocumentTypeMut = useCreateDocumentType();

  const typesById = useMemo(
    () => Object.fromEntries((typesPage?.items ?? []).map((t) => [t.id ?? "", t])),
    [typesPage?.items]
  );

  const docs = useMemo(
    () =>
      (apiProduct?.productDocumentTypes ?? []).map((entry) =>
        mapProductDocumentType(productId, entry, typesById[entry.documentTypeId ?? ""])
      ),
    [apiProduct?.productDocumentTypes, typesById, productId]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [requiredFilter, setRequiredFilter] = useState<"all" | "yes" | "no">("all");
  const [pepFilter, setPepFilter] = useState<"all" | "yes" | "no">("all");
  const [foreignFilter, setForeignFilter] = useState<"all" | "yes" | "no">("all");

  const filteredDocs = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    const matchesTri = (filter: "all" | "yes" | "no", value: boolean | null | undefined) => {
      if (filter === "all") return true;
      if (filter === "yes") return value === true;
      return value === false;
    };
    return docs.filter((d) => {
      if (q && !`${d.name} ${d.notes ?? ""}`.toLowerCase().includes(q)) return false;
      if (!matchesTri(requiredFilter, d.isMandatory)) return false;
      if (!matchesTri(pepFilter, d.isPep)) return false;
      if (!matchesTri(foreignFilter, d.isForeignCitizen)) return false;
      return true;
    });
  }, [docs, nameFilter, requiredFilter, pepFilter, foreignFilter]);

  const hasDocFilters =
    Boolean(nameFilter.trim()) ||
    requiredFilter !== "all" ||
    pepFilter !== "all" ||
    foreignFilter !== "all";

  const openNew = () => { setDialogOpen(true); };

  const linkedDocumentTypeIds = useMemo(
    () => (apiProduct?.productDocumentTypes ?? []).map((e) => e.documentTypeId ?? "").filter(Boolean),
    [apiProduct?.productDocumentTypes]
  );

  const handleSave = async (
    d: ProductDocument & { description?: string; templateFile?: File | null }
  ) => {
    try {
      let documentTypeId = d.documentTypeId;
      if (!documentTypeId) {
        let templateDocumentId = d.templateDocumentId || null;
        if (d.templateFile) {
          const uploaded = await createDocument(
            buildCreateDocumentFormData(d.templateFile, d.templateFile.name)
          );
          if (!uploaded.id) throw new Error("Failed to upload template document");
          templateDocumentId = uploaded.id;
        }
        const created = await createDocumentTypeMut.mutateAsync(
          buildDocumentTypeWriteBody(
            d.name.trim(),
            (d.description ?? d.name).trim() || d.name.trim(),
            templateDocumentId,
          ),
        );
        if (!created.id) throw new Error("Document type created without id");
        documentTypeId = created.id;
      }
      await addProductDocumentType.mutateAsync({
        productId,
        body: buildAddProductDocumentTypeBody({
          documentTypeId,
          alwaysRequired: d.isMandatory,
          insuredAmountOver: d.insuredAmountOver ?? null,
          insuredAmountCurrency: d.insuredAmountCurrency ?? null,
          totalExposureOver: d.totalExposureOver ?? null,
          totalExposureCurrency: d.totalExposureCurrency ?? null,
          ageOver: d.ageOver ?? null,
          isPep: d.isPep ?? false,
          isForeignCitizen: d.isForeignCitizen ?? false,
          stages: d.stages && d.stages !== "none" ? d.stages : "initialOffer",
          reusePolicy: d.reusePolicy ?? "requireNewSubmission",
        }),
      });
      toast.success("Document type linked to product");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save document");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await removeProductDocumentType.mutateAsync({
        productId,
        documentTypeEntryId: deleteId,
      });
      setDeleteId(null);
      toast.success("Document removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove document");
    }
  };

  if (productLoading || typesLoading) {
    return (
      <Card className="p-10 shadow-card border-border border-dashed">
        <Loader label="Loading documents…" />
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Document types collected on offers for this product, including amount, PEP, citizenship, stage, and reuse rules.
          </span>
        </div>
        <Button size="sm" onClick={openNew} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Required documents</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasDocFilters
                  ? `${filteredDocs.length} of ${docs.length} document(s)`
                  : "Rules used when this product is quoted or renewed."}
              </p>
            </div>
            {hasDocFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => {
                  setNameFilter("");
                  setRequiredFilter("all");
                  setPepFilter("all");
                  setForeignFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          <FilterGrid>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Document</Label>
              <Input
                className="h-9"
                placeholder="Filter by name…"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Always required</Label>
              <Select value={requiredFilter} onValueChange={(v) => setRequiredFilter(v as "all" | "yes" | "no")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">PEP</Label>
              <Select value={pepFilter} onValueChange={(v) => setPepFilter(v as "all" | "yes" | "no")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Foreign citizen</Label>
              <Select value={foreignFilter} onValueChange={(v) => setForeignFilter(v as "all" | "yes" | "no")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterGrid>
        </div>

        {docs.length === 0 && (
          <div className="flex items-start gap-2 px-5 py-3 bg-accent-soft/40 border-b border-border text-xs">
            <Info className="h-4 w-4 mt-0.5 text-accent shrink-0" />
            <span className="text-accent-soft-foreground">
              No documents configured. Add document types to get started.
            </span>
          </div>
        )}

        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Document</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Always required</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Insured amount over</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Total exposure over</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Age over</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">PEP</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Foreign citizen</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                  No documents yet. Click <span className="font-medium text-foreground">Add Document</span> to create one.
                </TableCell>
              </TableRow>
            )}
            {docs.length > 0 && filteredDocs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                  No documents match the current filters.
                </TableCell>
              </TableRow>
            )}
            {filteredDocs.map((d) => (
              <TableRow key={d.id} className="hover:bg-accent-soft/40">
                <TableCell>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground whitespace-nowrap">{d.name}</div>
                      {d.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-xs">{d.notes}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <AlwaysRequiredBadge value={d.isMandatory} />
                </TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">{formatAmount(d.insuredAmountOver, d.insuredAmountCurrency)}</TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">{formatAmount(d.totalExposureOver, d.totalExposureCurrency)}</TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">
                  {d.ageOver == null ? "—" : d.ageOver}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <YesNoBadge value={d.isPep} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <YesNoBadge value={d.isForeignCitizen} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    title="Remove document"
                    onClick={() => setDeleteId(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {dialogOpen && (
        <DocumentDialog
          key="new"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={productId}
          versionId={VERSION_NA}
          linkedDocumentTypeIds={linkedDocumentTypeIds}
          currencies={apiProduct?.supportedCurrencies ?? []}
          onSave={(d) => void handleSave(d)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this document?</AlertDialogTitle>
            <AlertDialogDescription>
              The document will no longer be requested for new applications on this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsTab;
