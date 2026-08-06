import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import {
  ProductDocument, DocumentAppliesWhen,
} from "@/data/documents";
import DocumentDialog from "./DocumentDialog";
import {
  useGetProduct,
  useAddProductDocumentType,
  useRemoveProductDocumentType,
} from "@/api/products";
import {
  useListDocumentTypes,
} from "@/api/document-types";
import { mapProductDocumentType } from "@/api/adapters/document-types";

type Props = { productId: string };

const VERSION_NA = "N/A";

const fmtMoney = (n?: number) =>
  n && n > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : "—";

const appliesBadge = (a: DocumentAppliesWhen) => {
  switch (a) {
    case "Always": return "bg-success/15 text-success";
    case "Sum insured above threshold": return "bg-accent-soft text-accent-soft-foreground";
    case "Total exposure above threshold": return "bg-accent-soft text-accent-soft-foreground";
    case "Age above threshold": return "bg-accent-soft text-accent-soft-foreground";
    case "PEP detected": return "bg-warning/20 text-warning-foreground";
    case "Manual verification required": return "bg-destructive/10 text-destructive";
    case "Conditional": return "bg-muted text-muted-foreground";
  }
};

const rulesSummary = (d: ProductDocument) => {
  const parts: string[] = [];
  if (d.isMandatory) parts.push("Always");
  if (d.isPep) parts.push("PEP");
  if (d.insuredAmountOver != null && d.insuredAmountOver > 0) parts.push(`Insured > ${fmtMoney(d.insuredAmountOver)}`);
  if (d.totalExposureOver != null && d.totalExposureOver > 0) parts.push(`Exposure > ${fmtMoney(d.totalExposureOver)}`);
  if (d.ageOver != null && d.ageOver > 0) parts.push(`Age > ${d.ageOver}`);
  return parts.length ? parts.join(" · ") : d.appliesWhen;
};

const DocumentsTab = ({ productId }: Props) => {
  const { data: apiProduct, isLoading: productLoading } = useGetProduct(productId);
  const { data: typesPage, isLoading: typesLoading } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const addProductDocumentType = useAddProductDocumentType();
  const removeProductDocumentType = useRemoveProductDocumentType();

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

  const openNew = () => { setDialogOpen(true); };

  const linkedDocumentTypeIds = useMemo(
    () => (apiProduct?.productDocumentTypes ?? []).map((e) => e.documentTypeId ?? "").filter(Boolean),
    [apiProduct?.productDocumentTypes]
  );

  const handleSave = async (d: ProductDocument) => {
    try {
      const documentTypeId = d.documentTypeId;
      if (!documentTypeId) {
        toast.error("Document type is required");
        return;
      }
      await addProductDocumentType.mutateAsync({
        productId,
        body: {
          documentTypeId,
          alwaysRequired: d.isMandatory,
          insuredAmountOver: d.insuredAmountOver ?? null,
          totalExposureOver: d.totalExposureOver ?? null,
          ageOver: d.ageOver ?? null,
          isPep: d.isPep ?? null,
        },
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
      <Card className="p-10 text-center shadow-card border-border border-dashed">
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      </Card>
    );
  }

  const mandatoryCount = docs.filter((d) => d.isMandatory).length;
  const conditionalCount = docs.filter((d) => d.appliesWhen !== "Always").length;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Document requirements use the document-types API. Versioning is not available yet (shown as {VERSION_NA}).
          </span>
        </div>
        <Button size="sm" onClick={openNew} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="p-4 shadow-card border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total documents</div>
          <div className="text-2xl font-semibold mt-1">{docs.length}</div>
        </Card>
        <Card className="p-4 shadow-card border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mandatory</div>
          <div className="text-2xl font-semibold mt-1">{mandatoryCount}</div>
        </Card>
        <Card className="p-4 shadow-card border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Conditional</div>
          <div className="text-2xl font-semibold mt-1">{conditionalCount}</div>
        </Card>
      </div>

      <Card className="shadow-card border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Required documents</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Documents collected during application. Templates inherit this list.
            </p>
          </div>
        </div>

        {docs.length === 0 && (
          <div className="flex items-start gap-2 px-5 py-3 bg-accent-soft/40 border-b border-border text-xs">
            <Info className="h-4 w-4 mt-0.5 text-accent shrink-0" />
            <span className="text-accent-soft-foreground">
              No documents configured. Add the standard ID and beneficiary documents to get started.
            </span>
          </div>
        )}

        <Table>
            <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Document</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Document Type ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Always required</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Rules</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  No documents yet. Click <span className="font-medium text-foreground">Add Document</span> to create one.
                </TableCell>
              </TableRow>
            )}
            {docs.map((d) => (
              <TableRow key={d.id} className="hover:bg-accent-soft/40">
                <TableCell>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">{d.name}</div>
                      {d.documentTypeId && (
                        <div className="font-mono text-xs text-accent mt-0.5">{d.documentTypeId}</div>
                      )}
                      {d.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-md">{d.notes}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{d.documentTypeId ?? "—"}</TableCell>
                <TableCell>
                  {d.isMandatory ? (
                    <Badge className="bg-success/15 text-success border-0">Required</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-0">Optional</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className={`border-0 w-fit ${appliesBadge(d.appliesWhen)}`}>{d.appliesWhen}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => setDeleteId(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
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
