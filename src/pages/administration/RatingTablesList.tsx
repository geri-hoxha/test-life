import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  useCreateRatingTable,
  useDeleteRatingTable,
  useListRatingTables,
  useUpdateRatingTable,
} from "@/api/rating-tables";
import type { RatingTablesRatingTableResponse } from "@/api/types";
import { compactQuery } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toastApiError } from "@/lib/api-error";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const RatingTablesList = () => {
  const navigate = useNavigate();
  const [nameFilter, setNameFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RatingTablesRatingTableResponse | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RatingTablesRatingTableResponse | null>(null);

  const createTable = useCreateRatingTable();
  const updateTable = useUpdateRatingTable();
  const deleteTable = useDeleteRatingTable();
  const saving = createTable.isPending || updateTable.isPending;

  const filters = useMemo(
    () => compactQuery({ name: nameFilter.trim() || undefined }),
    [nameFilter],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListRatingTables(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);
  const hasFilters = Boolean(nameFilter.trim());

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (row: RatingTablesRatingTableResponse) => {
    setEditing(row);
    setName(row.name ?? "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setName("");
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }

    if (editing?.id) {
      updateTable.mutate(
        { id: editing.id, body: { name: trimmed } },
        {
          onSuccess: () => {
            toast.success("Rating table updated");
            closeDialog();
          },
          onError: (err) => toastApiError(err, "Failed to update rating table"),
        },
      );
      return;
    }

    createTable.mutate(
      { name: trimmed },
      {
        onSuccess: (created) => {
          toast.success("Rating table created");
          closeDialog();
          if (created.id) {
            navigate(`/administration/rating-tables/${created.id}`);
          }
        },
        onError: (err) => toastApiError(err, "Failed to create rating table"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteTable.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Rating table deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toastApiError(err, "Failed to delete rating table"),
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Rating tables</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage age and gender rating rules used by product coverages.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add rating table
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Rating tables</CardTitle>
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
                  onClick={() => setNameFilter("")}
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
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
                      No rating tables match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id ?? row.name}>
                      <TableCell className="font-medium">
                        {row.id ? (
                          <Link
                            to={`/administration/rating-tables/${row.id}`}
                            className="hover:text-accent transition-colors"
                          >
                            {row.name ?? "—"}
                          </Link>
                        ) : (
                          (row.name ?? "—")
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.rules?.length ?? 0}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={row.id}>
                        {row.id ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => row.id && navigate(`/administration/rating-tables/${row.id}`)}
                            title="Open rating table"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={!row.id}
                            onClick={() => openEdit(row)}
                            title="Rename rating table"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={!row.id}
                            onClick={() => setDeleteTarget(row)}
                            title="Delete rating table"
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
            <DialogTitle>{editing ? "Rename rating table" : "Add rating table"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the rating table name. Rules are managed on the detail page."
                : "Create a rating table, then add age and gender rules on the detail page."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="rt-name">Name</Label>
            <Input
              id="rt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard life rates"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
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
            <AlertDialogTitle>Delete rating table?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {deleteTarget?.name ? ` “${deleteTarget.name}”` : " this rating table"}
              and its rules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTable.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteTable.isPending} onClick={handleDelete}>
              {deleteTable.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default RatingTablesList;
