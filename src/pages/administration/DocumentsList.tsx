import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import AppShell from "@/components/layout/AppShell";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
  buildCreateDocumentFormData,
  downloadDocumentFile,
  useCreateDocument,
  useDeleteDocument,
  useListDocuments,
  useUpdateDocument,
} from "@/api/documents";
import type { DocumentsDocumentResponse } from "@/api/types";
import { compactQuery, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toastApiError } from "@/lib/api-error";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type DeletedFilter = "all" | "yes" | "no";

const toDate = (isoDay: string) => {
  if (!isoDay) return undefined;
  try {
    return parseISO(isoDay);
  } catch {
    return undefined;
  }
};

const formatCreated = (iso?: string) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
};

const formatSize = (bytes?: number) => {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentsList = () => {
  const [originalFileNameFilter, setOriginalFileNameFilter] = useState("");
  const [isDeletedFilter, setIsDeletedFilter] = useState<DeletedFilter>("no");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [editing, setEditing] = useState<DocumentsDocumentResponse | null>(null);
  const [editFileName, setEditFileName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<DocumentsDocumentResponse | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const filters = useMemo(
    () =>
      compactQuery({
        originalFileName: originalFileNameFilter.trim() || undefined,
        isDeleted:
          isDeletedFilter === "all" ? undefined : isDeletedFilter === "yes",
        createdFromUtc: dateToUtcStart(createdFrom),
        createdToUtc: dateToUtcEnd(createdTo),
      }),
    [originalFileNameFilter, isDeletedFilter, createdFrom, createdTo],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListDocuments(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);

  const hasFilters =
    Boolean(originalFileNameFilter.trim()) ||
    isDeletedFilter !== "no" ||
    Boolean(createdFrom) ||
    Boolean(createdTo);

  const clearFilters = () => {
    setOriginalFileNameFilter("");
    setIsDeletedFilter("no");
    setCreatedFrom("");
    setCreatedTo("");
  };

  const closeUpload = () => {
    setUploadOpen(false);
    setUploadFile(null);
  };

  const handleUpload = () => {
    if (!uploadFile) {
      toast.error("Select a file to upload");
      return;
    }
    createDocument.mutate(buildCreateDocumentFormData(uploadFile, uploadFile.name), {
      onSuccess: () => {
        toast.success("Document uploaded");
        closeUpload();
      },
      onError: (err) => toastApiError(err, "Failed to upload document"),
    });
  };

  const openEdit = (row: DocumentsDocumentResponse) => {
    setEditing(row);
    setEditFileName(row.originalFileName ?? "");
  };

  const closeEdit = () => {
    setEditing(null);
    setEditFileName("");
  };

  const handleUpdate = () => {
    if (!editing?.id) return;
    const originalFileName = editFileName.trim();
    if (!originalFileName) {
      toast.error("Original file name is required");
      return;
    }
    updateDocument.mutate(
      { id: editing.id, body: { originalFileName } },
      {
        onSuccess: () => {
          toast.success("Document updated");
          closeEdit();
        },
        onError: (err) => toastApiError(err, "Failed to update document"),
      },
    );
  };

  const handleDownload = async (row: DocumentsDocumentResponse) => {
    if (!row.id) return;
    setDownloadingId(row.id);
    try {
      await downloadDocumentFile(row.id, row.originalFileName);
    } catch (err) {
      toastApiError(err, "Failed to download document");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteDocument.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Document deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toastApiError(err, "Failed to delete document"),
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload, rename, download, and manage stored files.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Documents</CardTitle>
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
                <Label className="text-xs text-muted-foreground">Original file name</Label>
                <Input
                  className="h-9"
                  placeholder="Filter by file name"
                  value={originalFileNameFilter}
                  onChange={(e) => setOriginalFileNameFilter(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Deleted</Label>
                <Select
                  value={isDeletedFilter}
                  onValueChange={(v) => setIsDeletedFilter(v as DeletedFilter)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="no">Active</SelectItem>
                    <SelectItem value="yes">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Created from</Label>
                <DatePicker
                  value={toDate(createdFrom)}
                  onChange={(d) => setCreatedFrom(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="From date"
                  buttonClassName="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Created to</Label>
                <DatePicker
                  value={toDate(createdTo)}
                  onChange={(d) => setCreatedTo(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="To date"
                  buttonClassName="h-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Original file name</TableHead>
                  <TableHead>MIME type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      Loading data, please wait…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      No documents match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => {
                    const deleted = Boolean(row.deletedOn);
                    return (
                      <TableRow key={row.id ?? row.storageKey}>
                        <TableCell className="font-medium max-w-[260px] truncate" title={row.originalFileName}>
                          {row.originalFileName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                          {row.mimeType ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">{formatSize(row.sizeBytes)}</TableCell>
                        <TableCell className="text-sm tabular-nums">{formatCreated(row.createdOn)}</TableCell>
                        <TableCell>
                          {deleted ? (
                            <Badge variant="outline" className="bg-rose-50 text-rose-900 border-rose-200">
                              Deleted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-200">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={!row.id || downloadingId === row.id || deleted}
                              onClick={() => void handleDownload(row)}
                              title="Download file"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={!row.id || deleted}
                              onClick={() => openEdit(row)}
                              title="Rename document"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              disabled={!row.id || deleted}
                              onClick={() => setDeleteTarget(row)}
                              title="Delete document"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open) closeUpload();
          else setUploadOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>Upload a file to document storage via POST /api/documents.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-file">File *</Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground truncate">{uploadFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUpload} disabled={createDocument.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={createDocument.isPending || !uploadFile}>
              {createDocument.isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>Update the original file name shown for this document.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-original-name">Original file name *</Label>
              <Input
                id="doc-original-name"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="e.g. schedule.pdf"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={updateDocument.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateDocument.isPending}>
              {updateDocument.isPending ? "Saving…" : "Save changes"}
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
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete
              {deleteTarget?.originalFileName
                ? ` “${deleteTarget.originalFileName}”`
                : " this document"}
              . Soft-deleted files can be listed with the Deleted filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocument.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteDocument.isPending} onClick={handleDelete}>
              {deleteDocument.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default DocumentsList;
