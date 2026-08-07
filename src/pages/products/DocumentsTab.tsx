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
import { ProductDocument } from "@/data/documents";
import DocumentDialog from "./DocumentDialog";
import {
  useGetProduct,
  useAddProductDocumentType,
  useRemoveProductDocumentType,
} from "@/api/products";
import {
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

const formatAmount = (value: number | null | undefined) => {
  if (value == null) return "—";
  return value.toLocaleString();
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
        const created = await createDocumentTypeMut.mutateAsync({
          name: d.name.trim(),
          description: (d.description ?? d.name).trim() || d.name.trim(),
          templateDocumentId,
        });
        if (!created.id) throw new Error("Document type created without id");
        documentTypeId = created.id;
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

  const alwaysRequiredCount = docs.filter((d) => d.isMandatory).length;
  const conditionalCount = docs.filter((d) => !d.isMandatory).length;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Product document types and their <span className="font-mono">requiredFor</span> rules from the product API.
          </span>
        </div>
        <Button size="sm" onClick={openNew} className="ml-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="p-4 shadow-card border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total</div>
          <div className="text-2xl font-semibold mt-1">{docs.length}</div>
        </Card>
        <Card className="p-4 shadow-card border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Always required</div>
          <div className="text-2xl font-semibold mt-1">{alwaysRequiredCount}</div>
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
              All fields from <span className="font-mono">productDocumentTypes</span> / <span className="font-mono">requiredFor</span>.
            </p>
          </div>
        </div>

        {docs.length === 0 && (
          <div className="flex items-start gap-2 px-5 py-3 bg-accent-soft/40 border-b border-border text-xs">
            <Info className="h-4 w-4 mt-0.5 text-accent shrink-0" />
            <span className="text-accent-soft-foreground">
              No documents configured. Add document types to get started.
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Document</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Always required</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Insured amount over</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Total exposure over</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Age over</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">PEP</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    No documents yet. Click <span className="font-medium text-foreground">Add Document</span> to create one.
                  </TableCell>
                </TableRow>
              )}
              {docs.map((d) => (
                <TableRow key={d.id} className="hover:bg-accent-soft/40">
                  <TableCell>
                    <div className="flex items-start gap-2 min-w-[10rem]">
                      <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium text-foreground">{d.name}</div>
                        {d.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-xs">{d.notes}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={d.isMandatory} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatAmount(d.insuredAmountOver)}</TableCell>
                  <TableCell className="font-mono text-sm">{formatAmount(d.totalExposureOver)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {d.ageOver == null ? "—" : d.ageOver}
                  </TableCell>
                  <TableCell>
                    <YesNoBadge value={d.isPep} />
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
        </div>
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
