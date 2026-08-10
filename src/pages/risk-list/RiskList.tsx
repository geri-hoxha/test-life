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
import { Textarea } from "@/components/ui/textarea";
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
  useCreateRiskListEntry,
  useDeleteRiskListEntry,
  useListRiskListEntries,
} from "@/api/risk-list-entries";
import type { DomainComplianceRiskListType, RiskListsRiskListEntryResponse } from "@/api/types";
import { compactQuery, dateToUtcEnd, dateToUtcStart } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toastApiError } from "@/lib/api-error";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LIST_TYPES: { value: DomainComplianceRiskListType; label: string }[] = [
  { value: "pep", label: "PEP" },
  { value: "blackList", label: "Black list" },
];

const listTypeLabel = (type?: DomainComplianceRiskListType) =>
  LIST_TYPES.find((t) => t.value === type)?.label ?? type ?? "—";

const listTypeBadgeClass = (type?: DomainComplianceRiskListType) => {
  if (type === "pep") return "bg-amber-100 text-amber-900 border-amber-200";
  if (type === "blackList") return "bg-rose-100 text-rose-900 border-rose-200";
  return "";
};

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

const RiskList = () => {
  const [personalIdentifier, setPersonalIdentifier] = useState("");
  const [listType, setListType] = useState<DomainComplianceRiskListType | "ALL">("ALL");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [addOpen, setAddOpen] = useState(false);
  const [formIdentifier, setFormIdentifier] = useState("");
  const [formListType, setFormListType] = useState<DomainComplianceRiskListType>("pep");
  const [formReason, setFormReason] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<RiskListsRiskListEntryResponse | null>(null);

  const createEntry = useCreateRiskListEntry();
  const deleteEntry = useDeleteRiskListEntry();

  const filters = useMemo(
    () =>
      compactQuery({
        personalIdentifier: personalIdentifier.trim() || undefined,
        ...(listType !== "ALL" ? { listType } : {}),
        createdFromUtc: dateToUtcStart(createdFrom),
        createdToUtc: dateToUtcEnd(createdTo),
      }),
    [personalIdentifier, listType, createdFrom, createdTo],
  );
  const debouncedFilters = useDebouncedValue(filters);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, pageSize]);

  const listQuery = { ...debouncedFilters, pageNumber: page, pageSize };
  const { data: pageData, isLoading, isFetching } = useListRiskListEntries(listQuery);

  const items = pageData?.items ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, pageData?.totalPages ?? pageData?.pageCount ?? 1);

  const hasFilters =
    Boolean(personalIdentifier.trim()) ||
    listType !== "ALL" ||
    Boolean(createdFrom) ||
    Boolean(createdTo);

  const clearFilters = () => {
    setPersonalIdentifier("");
    setListType("ALL");
    setCreatedFrom("");
    setCreatedTo("");
  };

  const resetAddForm = () => {
    setFormIdentifier("");
    setFormListType("pep");
    setFormReason("");
  };

  const handleAdd = () => {
    const identifier = formIdentifier.trim();
    const reason = formReason.trim();
    if (!identifier) {
      toast.error("Personal identifier is required");
      return;
    }
    if (!reason) {
      toast.error("Reason is required");
      return;
    }
    createEntry.mutate(
      {
        personalIdentifier: identifier,
        listType: formListType,
        reason,
      },
      {
        onSuccess: () => {
          toast.success("Risk list entry added");
          resetAddForm();
          setAddOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to add risk list entry"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteEntry.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Risk list entry removed");
        setDeleteTarget(null);
      },
      onError: (err) => toastApiError(err, "Failed to remove risk list entry"),
    });
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Compliance
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Risk list</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage PEP and blacklist entries used for compliance screening.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Risk list entries</CardTitle>
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
                <Label className="text-xs text-muted-foreground">Personal identifier</Label>
                <Input
                  className="h-9"
                  placeholder="SSN / personal ID"
                  value={personalIdentifier}
                  onChange={(e) => setPersonalIdentifier(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">List type</Label>
                <Select
                  value={listType}
                  onValueChange={(v) => setListType(v as DomainComplianceRiskListType | "ALL")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    {LIST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
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
                  <TableHead>Personal identifier</TableHead>
                  <TableHead>List type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                      Loading data, please wait…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                      No risk list entries match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id ?? `${row.personalIdentifier}-${row.createdOnUtc}`}>
                      <TableCell className="font-mono text-xs font-medium">
                        {row.personalIdentifier ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={listTypeBadgeClass(row.listType)}>
                          {listTypeLabel(row.listType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[360px] truncate" title={row.reason}>
                        {row.reason?.trim() || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatCreated(row.createdOnUtc)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          disabled={!row.id}
                          onClick={() => setDeleteTarget(row)}
                          title="Remove entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add risk list entry</DialogTitle>
            <DialogDescription>
              Add a personal identifier to the PEP or blacklist.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="risk-personal-id">Personal identifier</Label>
              <Input
                id="risk-personal-id"
                value={formIdentifier}
                onChange={(e) => setFormIdentifier(e.target.value)}
                placeholder="SSN / personal ID"
                maxLength={64}
              />
            </div>
            <div className="space-y-1.5">
              <Label>List type</Label>
              <Select
                value={formListType}
                onValueChange={(v) => setFormListType(v as DomainComplianceRiskListType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="risk-reason">Reason</Label>
              <Textarea
                id="risk-reason"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Why this person is on the list"
                maxLength={512}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createEntry.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createEntry.isPending}>
              {createEntry.isPending ? "Saving…" : "Add entry"}
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
            <AlertDialogTitle>Remove risk list entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove
              {deleteTarget?.personalIdentifier
                ? ` “${deleteTarget.personalIdentifier}”`
                : " this entry"}{" "}
              from the {listTypeLabel(deleteTarget?.listType).toLowerCase()} list. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEntry.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteEntry.isPending} onClick={handleDelete}>
              {deleteEntry.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default RiskList;
