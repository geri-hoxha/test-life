import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { listVersions } from "@/data/productVersions";
import {
  ProductDocument, DocumentAppliesWhen,
  listDocuments, upsertDocument, deleteDocument,
} from "@/data/documents";
import DocumentDialog from "./DocumentDialog";

type Props = { productId: string };

const appliesBadge = (a: DocumentAppliesWhen) => {
  switch (a) {
    case "Always": return "bg-success/15 text-success";
    case "Sum insured above threshold": return "bg-accent-soft text-accent-soft-foreground";
    case "PEP detected": return "bg-warning/20 text-warning-foreground";
    case "Manual verification required": return "bg-destructive/10 text-destructive";
  }
};

const fmtMoney = (n?: number) =>
  n && n > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : "—";

const DocumentsTab = ({ productId }: Props) => {
  const versions = useMemo(() => listVersions(productId), [productId]);
  const defaultVersion = versions.find((v) => v.status === "Active")?.id ?? versions[0]?.id ?? "";

  const [versionId, setVersionId] = useState(defaultVersion);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const docs = useMemo(() => {
    void tick;
    return versionId ? listDocuments(productId, versionId) : [];
  }, [productId, versionId, tick]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDocument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (d: ProductDocument) => { setEditing(d); setDialogOpen(true); };

  const handleSave = (d: ProductDocument) => {
    upsertDocument(d);
    refresh();
    toast.success(editing ? "Document updated" : "Document added");
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteDocument(deleteId);
    setDeleteId(null);
    refresh();
    toast.success("Document removed");
  };

  if (versions.length === 0) {
    return (
      <Card className="p-10 text-center shadow-card border-border border-dashed">
        <p className="text-sm text-muted-foreground">Create a product version first to define documents.</p>
      </Card>
    );
  }

  const mandatoryCount = docs.filter((d) => d.isMandatory).length;
  const conditionalCount = docs.filter((d) => d.appliesWhen !== "Always").length;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="hidden items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Version</span>
          <Select value={versionId} onValueChange={setVersionId}>
            <SelectTrigger className="w-[280px] h-9">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="font-mono text-xs text-accent mr-2">{v.number}</span>
                  {v.name} <span className="ml-2 text-xs text-muted-foreground">· {v.status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openNew} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      {/* Stats */}
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

      {/* Table */}
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
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Required For</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Mandatory</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Applies When</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Threshold</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
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
                      {d.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-md">{d.notes}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {d.requiredFor.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {d.isMandatory ? (
                    <Badge className="bg-success/15 text-success border-0">Required</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-0">Optional</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`border-0 ${appliesBadge(d.appliesWhen)}`}>{d.appliesWhen}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {d.appliesWhen === "Sum insured above threshold" ? fmtMoney(d.thresholdAmount) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { upsertDocument({ ...d, isMandatory: !d.isMandatory }); refresh(); toast.success("Updated"); }}
                        >
                          Mark as {d.isMandatory ? "optional" : "mandatory"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(d.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {dialogOpen && versionId && (
        <DocumentDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={productId}
          versionId={versionId}
          initial={editing}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this document?</AlertDialogTitle>
            <AlertDialogDescription>
              The document will no longer be requested for new applications on this version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsTab;
