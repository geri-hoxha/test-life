import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCreateDocumentType,
  useDeleteDocumentType,
  useListDocumentTypes,
  useUpdateDocumentType,
} from "@/api/document-types";
import {
  buildCreateDocumentFormData,
  createDocument,
  downloadDocumentFile,
  useListDocuments,
} from "@/api/documents";
import type { DocumentsDocumentTypesDocumentTypeResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toastApiError } from "@/lib/api-error";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type HasTemplateFilter = "all" | "yes" | "no";

type FormState = {
  name: string;
  description: string;
  templateDocumentId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  templateDocumentId: "",
});

const formFromRow = (row: DocumentsDocumentTypesDocumentTypeResponse): FormState => ({
  name: row.name ?? "",
  description: row.description ?? "",
  templateDocumentId: row.templateDocumentId ?? "",
});

const DocumentTypesList = () => {
  const [nameFilter, setNameFilter] = useState("");
  const [hasTemplateFilter, setHasTemplateFilter] = useState<HasTemplateFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentsDocumentTypesDocumentTypeResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentsDocumentTypesDocumentTypeResponse | null>(
    null,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const createDocumentType = useCreateDocumentType();
  const updateDocumentType = useUpdateDocumentType();
  const deleteDocumentType = useDeleteDocumentType();
  const { data: documentsPage } = useListDocuments({ pageNumber: 1, pageSize: 200 });
  const templateDocuments = documentsPage?.items ?? [];

  const templateFileName = (templateDocumentId: string) => {
    const doc = templateDocuments.find((d) => d.id === templateDocumentId);
    return doc?.originalFileName ?? doc?.storedFileName;
  };

  const handleDownloadTemplate = async (templateDocumentId: string) => {
    setDownloadingId(templateDocumentId);
    try {
      await downloadDocumentFile(templateDocumentId, templateFileName(templateDocumentId));
    } catch (err) {
      toastApiError(err, "Failed to download template");
    } finally {
      setDownloadingId(null);
    }
  };

  const filters = useMemo(
    () =>
      compactQuery({
        name: nameFilter.trim() || undefined,
        hasTemplate:
          hasTemplateFilter === "all" ? undefined : hasTemplateFilter === "yes",
      }),
    [nameFilter, hasTemplateFilter],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListDocumentTypes(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);
  const hasFilters = Boolean(nameFilter.trim()) || hasTemplateFilter !== "all";

  const clearFilters = () => {
    setNameFilter("");
    setHasTemplateFilter("all");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setTemplateFile(null);
    setDialogOpen(true);
  };

  const openEdit = (row: DocumentsDocumentTypesDocumentTypeResponse) => {
    setEditing(row);
    setForm(formFromRow(row));
    setTemplateFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
    setTemplateFile(null);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }

    const description = form.description.trim() || name;
    setSaving(true);
    try {
      let templateDocumentId: string | null = form.templateDocumentId.trim() || null;
      if (templateFile) {
        const uploaded = await createDocument(
          buildCreateDocumentFormData(templateFile, templateFile.name),
        );
        if (!uploaded.id) throw new Error("Failed to upload template document");
        templateDocumentId = uploaded.id;
      }

      const body = { name, description, templateDocumentId };

      if (editing?.id) {
        await updateDocumentType.mutateAsync({ id: editing.id, body });
        toast.success("Document type updated");
      } else {
        await createDocumentType.mutateAsync(body);
        toast.success("Document type created");
      }
      closeDialog();
    } catch (err) {
      toastApiError(
        err,
        editing ? "Failed to update document type" : "Failed to create document type",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteDocumentType.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Document type deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toastApiError(err, "Failed to delete document type"),
    });
  };

  const busy = saving || createDocumentType.isPending || updateDocumentType.isPending;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Document types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the catalog of document types and their templates.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add document type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Document types</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading…"
                    : `${totalCount} total${isFetching && !isLoading ? " · updating…" : ""}`}
                </CardDescription>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  className="h-9"
                  placeholder="Filter by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Has template</Label>
                <Select
                  value={hasTemplateFilter}
                  onValueChange={(v) => setHasTemplateFilter(v as HasTemplateFilter)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-sm text-muted-foreground">
                      Loading data, please wait…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-sm text-muted-foreground">
                      No document types match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id ?? row.name}>
                      <TableCell className="font-medium">{row.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                        {row.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        {row.templateDocumentId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={downloadingId === row.templateDocumentId}
                            onClick={() => void handleDownloadTemplate(row.templateDocumentId!)}
                            title="Download template"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => openEdit(row)}
                            title="Edit document type"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={!row.id}
                            onClick={() => setDeleteTarget(row)}
                            title="Delete document type"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit document type" : "Add document type"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the name, description, and optional template document."
                : "Create a document type for the catalog. Template is optional."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dt-name">Name *</Label>
              <Input
                id="dt-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. ID Card / Passport"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dt-desc">Description</Label>
              <Textarea
                id="dt-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Optional — defaults to name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Template document</Label>
              <Select
                value={form.templateDocumentId || "none"}
                onValueChange={(v) => {
                  setField("templateDocumentId", v === "none" ? "" : v);
                  setTemplateFile(null);
                }}
                disabled={Boolean(templateFile)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select existing document…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templateDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id ?? ""}>
                      {doc.originalFileName ?? doc.storedFileName ?? doc.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Or upload template</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setTemplateFile(file);
                  if (file) setField("templateDocumentId", "");
                }}
              />
              {templateFile && (
                <p className="text-xs text-muted-foreground truncate">
                  Will upload: {templateFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {deleteTarget?.name ? ` “${deleteTarget.name}”` : " this document type"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocumentType.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteDocumentType.isPending} onClick={handleDelete}>
              {deleteDocumentType.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default DocumentTypesList;
